import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthField from '../components/AuthField.jsx';
import { errorMessage } from '../utils/errors.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Contrôles en direct : le message n'apparaît que si le champ a été rempli.
  const usernameError =
    username && !USERNAME_REGEX.test(username)
      ? '3 à 20 caractères : lettres, chiffres ou underscore.'
      : '';
  const passwordReady = password.length >= PASSWORD_MIN;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, displayName);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, "Inscription impossible."));
    } finally {
      setLoading(false);
    }
  };

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
          id="display-name"
          label="Nom affiché"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={username || 'Ton pseudo'}
          autoComplete="nickname"
          maxLength={64}
          hint="Facultatif. Le pseudo est utilisé si tu ne remplis rien."
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
          hint={passwordReady ? `${PASSWORD_MIN} caractères minimum, c'est bon.` : `${PASSWORD_MIN} caractères minimum.`}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="shrink-0 rounded text-sm text-ink-muted hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          }
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !!usernameError}
          className="w-full rounded-md bg-signal py-3 text-base font-medium text-signal-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-50"
        >
          {loading ? 'Création en cours…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthLayout>
  );
}
