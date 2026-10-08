import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthField from '../components/AuthField.jsx';
import PasswordToggle from '../components/PasswordToggle.jsx';
import { errorMessage } from '../utils/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Un seul interrupteur pour les deux champs de mot de passe : ils s'affichent ou se masquent ensemble.
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Contrôles en direct : un message n'apparaît que si le champ a été rempli.
  const emailError = email && !EMAIL_REGEX.test(email.trim()) ? 'Cette adresse ne semble pas valide.' : '';
  const usernameError =
    username && !USERNAME_REGEX.test(username) ? '3 à 20 caractères : lettres, chiffres ou underscore.' : '';
  const passwordTooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const confirmError = confirmPassword && !passwordsMatch ? 'Les deux mots de passe ne correspondent pas.' : '';

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
      setError(errorMessage(err, 'Inscription impossible.'));
    } finally {
      setLoading(false);
    }
  };

  const eyeToggle = <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />;

  return (
    <AuthLayout
      headline="Commence ton carnet."
      intro="Crée ton compte, puis note ce que tu as déjà vu. Tu peux aussi repartir de zéro."
      title="Créer un compte"
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-signal underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-7">
        <AuthField
          id="email"
          type="email"
          label="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={emailError}
          hint={emailError ? undefined : 'Pour confirmer ton compte et récupérer ton mot de passe.'}
        />

        <AuthField
          id="username"
          label="Pseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={usernameError}
          hint={usernameError ? undefined : 'Lettres, chiffres et underscore. Il sert à te retrouver.'}
        />

        <AuthField
          id="password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={passwordTooShort ? `${PASSWORD_MIN} caractères minimum.` : ''}
          hint={passwordTooShort ? undefined : `${PASSWORD_MIN} caractères minimum.`}
          suffix={eyeToggle}
        />

        <AuthField
          id="confirm-password"
          label="Confirme le mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          error={confirmError}
          hint={passwordsMatch ? 'Les mots de passe correspondent.' : undefined}
          suffix={eyeToggle}
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-signal py-3 text-base font-medium text-signal-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-50"
        >
          {loading ? 'Création en cours…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthLayout>
  );
}
