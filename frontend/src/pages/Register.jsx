import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, displayName);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.details ? ` (${err.response.data.details})` : '';
      setError((err.response?.data?.error || "Erreur lors de l'inscription") + detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-1 text-center">📺 TV Tracker</h1>
      <p className="text-sm text-zinc-500 text-center mb-8">Crée ton compte</p>

      <form onSubmit={submit} className="card p-6 space-y-4">
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Pseudo (unique, 3-20 caractères)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            pattern="[a-zA-Z0-9_]{3,20}"
            title="Lettres, chiffres et underscore uniquement, 3 à 20 caractères"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Nom affiché (optionnel)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={username || 'Comme le pseudo si laissé vide'}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Mot de passe (8 caractères min.)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-accent"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2 text-sm disabled:opacity-50">
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
