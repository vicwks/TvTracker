import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import client from '../api/client.js';

const COLORS = ['#2dd4bf', '#a78bfa', '#fb7185', '#fbbf24', '#34d399', '#f472b6', '#c084fc', '#a3e635'];

// Formate un nombre de minutes en "X mois, Y j, Zh" (n'affiche que les unités pertinentes)
function formatDuration(totalMinutes) {
  const totalHours = Math.floor(totalMinutes / 60);
  const months = Math.floor(totalHours / (24 * 30));
  const days = Math.floor((totalHours % (24 * 30)) / 24);
  const hours = totalHours % 24;

  const parts = [];
  if (months > 0) parts.push(`${months} mois`);
  if (days > 0) parts.push(`${days} j`);
  if (hours > 0 || parts.length === 0) parts.push(`${hours}h`);
  return parts.join(', ');
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    client
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error(err);
        const detail = err.response?.data?.details ? ` (${err.response.data.details})` : '';
        setError(
          (err.response?.data?.error ||
            "Impossible de charger les statistiques. Vérifie que le backend tourne bien et que la migration de base de données a été relancée (npm run migrate).") +
            detail
        );
      });
  };

  useEffect(load, []);

  const refreshRuntimes = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const { data } = await client.post('/shows/refresh-runtimes');
      setMessage(`Durées mises à jour pour ${data.updated}/${data.total} séries ✅`);
      load();
    } catch {
      setMessage('Erreur pendant la mise à jour des durées.');
    } finally {
      setRefreshing(false);
    }
  };

  const cleanRuntimes = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      const { data } = await client.post('/shows/clean-runtimes');
      setMessage(`Nettoyage terminé : ${data.episodesFixed} épisode(s) et ${data.showsFixed} série(s) corrigés ✅`);
      load();
    } catch {
      setMessage('Erreur pendant le nettoyage des durées.');
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="card p-6 border-rose-900">
          <p className="text-rose-300 text-sm">{error}</p>
          <button onClick={load} className="btn-secondary text-xs px-3 py-1.5 mt-3">
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  if (!stats) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const hours = Math.round(stats.totalMinutes / 60);
  const durationLabel = formatDuration(stats.totalMinutes);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Statistiques</h1>
        <div className="text-right">
          <div className="flex gap-2 justify-end">
            <button
              onClick={cleanRuntimes}
              disabled={refreshing}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
              title="Met à NULL les durées d'épisode aberrantes déjà stockées en base (> 4h)"
            >
              {refreshing ? '...' : '🧹 Nettoyer les durées aberrantes'}
            </button>
            <button
              onClick={refreshRuntimes}
              disabled={refreshing}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
              title="TMDB ne renseigne pas toujours la durée de chaque épisode : ce bouton récupère la durée moyenne de chaque série pour affiner le calcul du temps visionné."
            >
              {refreshing ? 'Mise à jour en cours...' : '⏱️ Corriger les durées manquantes'}
            </button>
          </div>
          {message && <p className="text-xs text-zinc-500 mt-1">{message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-accent">{durationLabel}</p>
          <p className="text-sm text-zinc-500 mt-1">Temps total visionné ({hours}h)</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-accent">{stats.episodesWatched}</p>
          <p className="text-sm text-zinc-500 mt-1">Épisodes vus</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-accent">{stats.moviesWatched}</p>
          <p className="text-sm text-zinc-500 mt-1">Films vus</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Évolution mensuelle</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Répartition par genre</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.genres} dataKey="value" nameKey="name" outerRadius={90} label>
                {stats.genres.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
