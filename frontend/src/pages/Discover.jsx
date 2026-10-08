import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import ShowCard from '../components/ShowCard.jsx';

export default function Discover() {
  const navigate = useNavigate();
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [mode, setMode] = useState('trending'); // "trending" | genre id
  const [genres, setGenres] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    client.get(`/discover/genres/${type}`).then((res) => setGenres(res.data));
    setMode('trending');
  }, [type]);

  useEffect(() => {
    setLoading(true);
    const url = mode === 'trending' ? `/discover/trending/${type}` : `/discover/by-genre/${type}/${mode}`;
    client
      .get(url)
      .then((res) => {
        setItems(res.data);
        setAddedIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [type, mode]);

  const addToTracking = async (item) => {
    try {
      if (type === 'shows') {
        await client.post('/shows', { tmdb_id: item.tmdb_id, status: 'to_watch' });
      } else {
        await client.post('/movies', { tmdb_id: item.tmdb_id });
      }
      setAddedIds((prev) => new Set(prev).add(item.tmdb_id));
    } catch {
      setMessage("Erreur lors de l'ajout.");
    }
  };

  const openDetail = async (item) => {
    setOpening(item.tmdb_id);
    try {
      const endpoint = type === 'shows' ? '/shows/resolve' : '/movies/resolve';
      const { data } = await client.get(`${endpoint}/${item.tmdb_id}`);
      navigate(type === 'shows' ? `/show/${data.id}` : `/movie/${data.id}`);
    } catch {
      setMessage("Erreur lors de l'ouverture de la fiche.");
      setOpening(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Découvrir</h1>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex gap-2">
          <button
            onClick={() => setType('shows')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              type === 'shows' ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Séries
          </button>
          <button
            onClick={() => setType('movies')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              type === 'movies' ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Films
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setMode('trending')}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            mode === 'trending' ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          🔥 Tendances du moment
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setMode(g.id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              mode === g.id ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-zinc-400 mb-4">{message}</p>}
      {loading ? (
        <p className="text-zinc-500 text-sm">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <ShowCard
              key={item.tmdb_id}
              item={item}
              onClick={() => openDetail(item)}
              onAdd={() => addToTracking(item)}
              added={addedIds.has(item.tmdb_id)}
              friendsWatching={item.friendsWatching}
              footer={opening === item.tmdb_id && <p className="text-[11px] text-accent mt-1">Ouverture...</p>}
            />
          ))}
        </div>
      )}
    </div>
  );
}
