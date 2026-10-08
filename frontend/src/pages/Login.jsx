import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthField from '../components/AuthField.jsx';
import AuthButton from '../components/AuthButton.jsx';
import PasswordToggle from '../components/PasswordToggle.jsx';
import { errorMessage } from '../utils/errors.js';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, t('auth.login.failed'), t('common.unreachable')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline={t('auth.login.headline')}
      intro={t('auth.login.intro')}
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-signal underline-offset-4 hover:underline">
            {t('auth.login.createLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="username"
          label={t('auth.login.username')}
          placeholder={t('auth.login.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />

        <AuthField
          id="password"
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          suffix={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <AuthButton disabled={loading}>{loading ? t('auth.login.submitting') : t('auth.login.submit')}</AuthButton>
      </form>
    </AuthLayout>
  );
}
