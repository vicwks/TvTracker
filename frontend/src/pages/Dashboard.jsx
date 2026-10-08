import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import ShowCard from '../components/ShowCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusMenu from '../components/StatusMenu.jsx';

export default function Dashboard() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      client.get('/shows'),
      client.get('/movies'),
      client.get('/calendar?days=14'),
      client.get('/stats'),
    ])
      .then(([showsRes, moviesRes, calRes, statsRes]) => {
        setShows(showsRes.data);
        setMovies(moviesRes.data);
        setCalendar(calRes.data.slice(0, 6));
        setStats(statsRes.data);
      })
      .catch((err) => {
        console.error(err);
        const detail = err.response?.data?.details ? ` (${err.response.data.details})` : '';
        setError(
          (err.response?.data?.error ||
            "Impossible de charger le dashboard. Vérifie que le backend tourne bien et que la migration de base de données a été relancée (npm run migrate).") +
            detail
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (showId, status) => {
    await client.patch(`/shows/${showId}/status`, { status });
    load();
  };

  const watching = shows.filter((s) => s.status === 'watching');
  const hours = stats ? Math.round(stats.totalMinutes / 60) : 0;

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? [
        ...shows
          .filter((s) => s.title.toLowerCase().includes(q))
          .map((s) => ({ type: 'show', id: s.id, title: s.title, poster_url: s.poster_url, status: s.status })),
        ...movies
          .filter((m) => m.title.toLowerCase().includes(q))
          .map((m) => ({ type: 'movie', id: m.id, title: m.title, poster_url: m.poster_url })),
      ].slice(0, 8)
    : [];

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Bon retour 👋</h1>
        <p className="text-sm text-zinc-500 mt-1">Voici où tu en es dans tes visionnages.</p>
      </div>

      <div className="relative max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Retrouver une série ou un film déjà suivi..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent"
        />
        {q && (
          <div className="absolute z-20 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
            {searchResults.length === 0 ? (
              <p className="text-xs text-zinc-500 px-3 py-3">Aucun résultat pour "{query}".</p>
            ) : (
              searchResults.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.type === 'show' ? `/show/${r.id}` : `/movie/${r.id}`}
                  onClick={() => setQuery('')}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 transition-colors"
                >
                  {r.poster_url ? (
                    <img src={r.poster_url} alt="" className="w-8 h-11 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-8 h-11 bg-zinc-800 rounded shrink-0" />
                  )}
                  <span className="text-sm text-zinc-200 truncate">{r.title}</span>
                  <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
                    {r.type === 'show' ? 'Série' : 'Film'}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{hours}h</p>
            <p className="text-xs text-zinc-500 mt-1">Temps total visionné</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{watching.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Séries en cours</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{stats.episodesWatched}</p>
            <p className="text-xs text-zinc-500 mt-1">Épisodes vus</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{stats.moviesWatched}</p>
            <p className="text-xs text-zinc-500 mt-1">Films vus</p>
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">📺 En cours de visionnage</h2>
          <Link to="/shows" className="text-xs text-accent hover:underline">
            Voir toutes mes séries →
          </Link>
        </div>

        {watching.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-zinc-400 text-sm">Aucune série en cours pour le moment.</p>
            <Link to="/search" className="text-accent text-sm hover:underline mt-2 inline-block">
              Va en chercher une à suivre →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watching.map((show) => (
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
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">🗓️ Prochains épisodes</h2>
          <Link to="/calendar" className="text-xs text-accent hover:underline">
            Voir le calendrier complet →
          </Link>
        </div>

        {calendar.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-zinc-400 text-sm">Rien de prévu dans les 14 prochains jours.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {calendar.map((ep) => (
              <Link
                key={ep.episode_id}
                to={`/show/${ep.show_id}`}
                className="card flex items-center gap-4 p-3 hover:border-zinc-700"
              >
                {ep.poster_url && (
                  <img src={ep.poster_url} alt="" className="w-10 h-14 object-cover rounded-md shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-zinc-100 truncate">{ep.show_title}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    S{ep.season_number}E{ep.episode_number} — {ep.episode_title}
                  </p>
                </div>
                <span className="text-xs text-zinc-500 shrink-0">{ep.air_date}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
