import { useRef, useState } from 'react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';
import { errorMessage } from '../utils/errors.js';
import Avatar from '../components/Avatar.jsx';
import AuthField from '../components/AuthField.jsx';
import PasswordToggle from '../components/PasswordToggle.jsx';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;
const AVATAR_SIZE = 192;
const LANGS = ['fr', 'en'];

// Recadre l'image au centre, en carré, et la réduit. Le fond est rempli d'encre pour les PNG transparents.
function toAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#171511';
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE
      );
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('not-an-image'));
    };
    img.src = objectUrl;
  });
}

// Paramètres du compte : photo, langue, pseudo et mot de passe. L'adresse email n'est pas modifiable.
export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { user, refresh } = useAuth();
  const fileInput = useRef(null);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNotice, setPhotoNotice] = useState(null);

  const [username, setUsername] = useState(user.username);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameNotice, setUsernameNotice] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState(null);

  const errorText = (err, fallback) => errorMessage(err, fallback, t('common.unreachable'));

  // Photo : le fichier est recadré et réduit dans le navigateur, puis envoyé au serveur.
  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setPhotoNotice(null);
    let dataUrl;
    try {
      dataUrl = await toAvatarDataUrl(file);
    } catch {
      setPhotoNotice({ type: 'error', text: t('settings.photoNotImage') });
      setPhotoBusy(false);
      return;
    }
    try {
      await client.post('/auth/avatar', { image: dataUrl });
      await refresh();
      setPhotoNotice({ type: 'ok', text: t('settings.photoSaved') });
    } catch (err) {
      setPhotoNotice({ type: 'error', text: errorText(err, t('settings.photoError')) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoNotice(null);
    try {
      await client.delete('/auth/avatar');
      await refresh();
      setPhotoNotice({ type: 'ok', text: t('settings.photoRemoved') });
    } catch (err) {
      setPhotoNotice({ type: 'error', text: errorText(err, t('settings.photoError')) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const usernameError = username && !USERNAME_REGEX.test(username) ? t('auth.register.usernameInvalid') : '';
  const canSaveUsername = !usernameBusy && !usernameError && username !== user.username;

  const submitUsername = async (e) => {
    e.preventDefault();
    if (!canSaveUsername) return;
    setUsernameBusy(true);
    setUsernameNotice(null);
    try {
      await client.patch('/auth/username', { username });
      await refresh();
      setUsernameNotice({ type: 'ok', text: t('settings.usernameSaved') });
    } catch (err) {
      setUsernameNotice({ type: 'error', text: errorText(err, t('settings.genericError')) });
    } finally {
      setUsernameBusy(false);
    }
  };

  const passwordTooShort = newPassword.length > 0 && newPassword.length < PASSWORD_MIN;
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSavePassword =
    !passwordBusy && currentPassword && newPassword.length >= PASSWORD_MIN && confirmPassword === newPassword;

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!canSavePassword) return;
    setPasswordBusy(true);
    setPasswordNotice(null);
    try {
      await client.patch('/auth/password', { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice({ type: 'ok', text: t('settings.passwordSaved') });
    } catch (err) {
      setPasswordNotice({ type: 'error', text: errorText(err, t('settings.genericError')) });
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-2xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('settings.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('settings.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('settings.subtitle')}</p>
        </header>

        <section className="animate-rise mt-14" style={{ animationDelay: '60ms' }}>
          <SectionTitle title={t('settings.emailTitle')} hint={t('settings.emailHint')} />
          {user.email ? (
            <p className="font-display text-xl text-paper break-all">{user.email}</p>
          ) : (
            <p className="text-sm text-ink-muted">{t('settings.emailNone')}</p>
          )}
        </section>

        <section className="animate-rise mt-14" style={{ animationDelay: '100ms' }}>
          <SectionTitle title={t('settings.photoTitle')} />
          <div className="flex items-center gap-6">
            <Avatar user={user} size="w-24 h-24" initialClass="font-display text-4xl" />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={photoBusy}
                  className="text-signal underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {t('settings.photoChange')}
                </button>
                {user.avatar_url && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoBusy}
                    className="text-ink-muted underline-offset-4 transition hover:text-danger hover:underline disabled:opacity-50"
                  >
                    {t('settings.photoRemove')}
                  </button>
                )}
              </div>
              <p className="text-xs text-ink-muted">{t('settings.photoHint')}</p>
              <input ref={fileInput} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            </div>
          </div>
          <Notice notice={photoNotice} />
        </section>

        <section className="animate-rise mt-14" style={{ animationDelay: '160ms' }}>
          <SectionTitle title={t('settings.languageTitle')} hint={t('settings.languageHint')} />
          <div role="group" aria-label={t('settings.languageTitle')} className="flex gap-3">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                  lang === code
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-ink-line text-ink-muted hover:border-signal/60 hover:text-paper'
                }`}
              >
                {t(`language.${code}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="animate-rise mt-14" style={{ animationDelay: '220ms' }}>
          <SectionTitle title={t('settings.usernameTitle')} />
          <form onSubmit={submitUsername} className="space-y-6">
            <AuthField
              id="settings-username"
              label={t('settings.usernameLabel')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              error={usernameError}
              hint={usernameError ? undefined : t('settings.usernameHint')}
            />
            <SaveButton disabled={!canSaveUsername} busy={usernameBusy} />
            <Notice notice={usernameNotice} />
          </form>
        </section>

        <section className="animate-rise mt-14" style={{ animationDelay: '280ms' }}>
          <SectionTitle title={t('settings.passwordTitle')} />
          <form onSubmit={submitPassword} className="space-y-6">
            <AuthField
              id="settings-current-password"
              label={t('settings.currentPassword')}
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              suffix={<PasswordToggle visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />}
            />
            <AuthField
              id="settings-new-password"
              label={t('settings.newPassword')}
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              error={passwordTooShort ? t('auth.register.passwordShort', { min: PASSWORD_MIN }) : ''}
              suffix={<PasswordToggle visible={showNew} onToggle={() => setShowNew((v) => !v)} />}
            />
            <AuthField
              id="settings-confirm-password"
              label={t('settings.confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              error={passwordMismatch ? t('settings.passwordMismatch') : ''}
              suffix={<PasswordToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            />
            <SaveButton disabled={!canSavePassword} busy={passwordBusy} />
            <Notice notice={passwordNotice} />
          </form>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-line pb-3">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function SaveButton({ disabled, busy }) {
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-40"
    >
      {busy ? t('settings.saving') : t('settings.save')}
    </button>
  );
}

function Notice({ notice }) {
  if (!notice) return null;
  return (
    <p role={notice.type === 'error' ? 'alert' : 'status'} className={`text-sm ${notice.type === 'error' ? 'text-danger' : 'text-signal'}`}>
      {notice.text}
    </p>
  );
}
