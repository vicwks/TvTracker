import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthField from '../components/AuthField.jsx';
import AuthButton from '../components/AuthButton.jsx';
import PasswordToggle from '../components/PasswordToggle.jsx';
import { errorMessage } from '../utils/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Un interrupteur par champ : l'œil ne change que le champ sur lequel on a cliqué.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Contrôles en direct : un message n'apparaît que si le champ a été rempli.
  const emailError = email && !EMAIL_REGEX.test(email.trim()) ? t('auth.register.emailInvalid') : '';
  const usernameError = username && !USERNAME_REGEX.test(username) ? t('auth.register.usernameInvalid') : '';
  const passwordTooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const confirmError = confirmPassword && !passwordsMatch ? t('auth.register.confirmMismatch') : '';

  const canSubmit =
    !loading &&
    !emailError &&
    !usernameError &&
    !confirmError &&
    password.length >= PASSWORD_MIN &&
    passwordsMatch;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ email: email.trim(), username, password });
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, t('auth.register.failed'), t('common.unreachable')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline={t('auth.register.headline')}
      intro={t('auth.register.intro')}
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-signal underline-offset-4 hover:underline">
            {t('auth.register.loginLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="email"
          type="email"
          label={t('auth.register.email')}
          placeholder={t('auth.register.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={emailError}
          hint={emailError ? undefined : t('auth.register.emailHint')}
        />

        <AuthField
          id="username"
          label={t('auth.register.username')}
          placeholder={t('auth.register.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={usernameError}
          hint={usernameError ? undefined : t('auth.register.usernameHint')}
        />

        <AuthField
          id="password"
          label={t('auth.register.password')}
          placeholder={t('auth.register.passwordPlaceholder', { min: PASSWORD_MIN })}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={passwordTooShort ? t('auth.register.passwordShort', { min: PASSWORD_MIN }) : ''}
          suffix={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />

        <AuthField
          id="confirm-password"
          label={t('auth.register.confirm')}
          placeholder={t('auth.register.confirmPlaceholder')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          error={confirmError}
          hint={passwordsMatch ? t('auth.register.confirmMatch') : undefined}
          suffix={
            <PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
          }
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <AuthButton disabled={!canSubmit}>
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
