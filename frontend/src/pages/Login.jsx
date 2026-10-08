import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import AuthField from '../components/AuthField.jsx';
import AuthButton from '../components/AuthButton.jsx';
import PasswordToggle from '../components/PasswordToggle.jsx';
import { errorMessage } from '../utils/errors.js';

export default function Login() {
  const { login } = useAuth();
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
      setError(errorMessage(err, 'Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Reprends là où tu t’es arrêté."
      intro="Tes séries, tes films et les épisodes que tu n’as pas encore vus, au même endroit."
      title="Connexion"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-signal underline-offset-4 hover:underline">
            Crée-le en une minute
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="username"
          label="Pseudo"
          placeholder="Ton pseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />

        <AuthField
          id="password"
          label="Mot de passe"
          placeholder="Ton mot de passe"
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

        <AuthButton disabled={loading}>{loading ? 'Connexion en cours…' : 'Se connecter'}</AuthButton>
      </form>
    </AuthLayout>
  );
}
