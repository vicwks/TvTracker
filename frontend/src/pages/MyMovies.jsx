import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import RatingStars from '../components/RatingStars.jsx';

export default function MyMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all | watched | to_watch
  const [query, setQuery] = useState('');

  const load = () => {
    client.get('/movies').then((res) => setMovies(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleWatched = async (id, watched) => {
    await client.patch(`/movies/${id}/watched`, { watched });
    load();
  };

  const rate = async (id, rating) => {
    await client.post(`/movies/${id}/rating`, { rating });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Retirer ce film de ton suivi ?')) return;
    await client.delete(`/movies/${id}`);
    load();
  };

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const filtered = movies
    .filter((m) => (tab === 'all' ? true : tab === 'watched' ? m.watched : !m.watched))
    .filter((m) => m.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Mes films</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Rechercher dans mes films..."
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent mb-5"
      />

      <div className="flex gap-2 mb-5">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'to_watch', label: 'À voir' },
          { key: 'watched', label: 'Vus' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              tab === t.key ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          {query ? `Aucun film ne correspond à "${query}".` : 'Aucun film ici. Ajoute-en depuis la page "Rechercher".'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filtered.map((movie) => (
            <div key={movie.id} className="flex flex-col h-full">
              <div className="card flex flex-col flex-1 relative">
                <Link to={`/movie/${movie.id}`} className="contents">
                  <div className="aspect-[2/3] bg-zinc-800 shrink-0 relative">
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                        Pas d'affiche
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{movie.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {(movie.release_date || '').slice(0, 4)}
                      {movie.runtime ? ` · ${movie.runtime} min` : ''}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggleWatched(movie.id, !movie.watched)}
                  className={`absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    movie.watched ? 'bg-accent text-zinc-950' : 'bg-black/60 text-zinc-300'
                  }`}
                  title={movie.watched ? 'Marquer comme non vu' : 'Marquer comme vu'}
                >
                  ✓
                </button>
                <div className="px-3 pb-3 -mt-1">
                  <RatingStars value={movie.rating} onChange={(val) => rate(movie.id, val)} />
                </div>
              </div>
              <button
                onClick={() => remove(movie.id)}
                className="mt-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded py-1"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
