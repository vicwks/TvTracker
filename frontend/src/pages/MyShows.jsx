import { useEffect, useState } from 'react';
import client from '../api/client.js';
import ShowCard from '../components/ShowCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusMenu from '../components/StatusMenu.jsx';

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'to_watch', label: 'À voir' },
  { key: 'watching', label: 'En cours' },
  { key: 'paused', label: 'En pause' },
  { key: 'completed', label: 'Terminées' },
  { key: 'dropped', label: 'Abandonnées' },
];

export default function MyShows() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [recomputing, setRecomputing] = useState(false);

  const load = () => {
    client.get('/shows').then((res) => setShows(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const recomputeStatuses = async () => {
    setRecomputing(true);
    try {
      await client.post('/shows/recompute-status');
      load();
    } finally {
      setRecomputing(false);
    }
  };

  const changeStatus = async (showId, status) => {
    await client.patch(`/shows/${showId}/status`, { status });
    load();
  };

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const filtered = shows
    .filter((s) => tab === 'all' || s.status === tab)
    .filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Mes séries</h1>
        <button
          onClick={recomputeStatuses}
          disabled={recomputing}
          className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
          title="Passe automatiquement en 'Terminé' les séries entièrement vues"
        >
          {recomputing ? 'Recalcul en cours...' : '🔄 Recalculer les statuts'}
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Rechercher dans mes séries..."
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent mb-5"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              tab === t.key ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t.label} {t.key !== 'all' && `(${shows.filter((s) => s.status === t.key).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-zinc-400 text-sm">
            {query
              ? `Aucune série ne correspond à "${query}".`
              : 'Aucune série ici pour l\'instant. Ajoute-en depuis la page "Rechercher".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filtered.map((show) => (
            <ShowCard
              key={show.id}
              item={show}
              linkTo={`/show/${show.id}`}
              cornerBadge={
                <StatusMenu status={show.status} onChange={(status) => changeStatus(show.id, status)} />
              }
              footer={
                <ProgressBar
                  value={show.watched_episodes}
                  max={show.total_episodes}
                  status={show.status}
                  className="mt-2"
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
