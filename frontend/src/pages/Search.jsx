import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import ShowCard from '../components/ShowCard.jsx';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());
  const [opening, setOpening] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const { data } = await client.get(`/search/${type}`, { params: { q: query } });
      setResults(data);
      setAddedIds(new Set());
    } catch {
      setMessage("Erreur lors de la recherche (vérifie ta clé TMDB dans le fichier .env du backend).");
    } finally {
      setLoading(false);
    }
  };

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

  // Ouvre la fiche détaillée de la série/film cliqué, même s'il n'est pas encore suivi
  // (on le met juste en cache localement pour pouvoir afficher sa page).
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
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Rechercher</h1>

      <form onSubmit={search} className="flex gap-2 mb-6">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-accent"
        >
          <option value="shows">Séries</option>
          <option value="movies">Films</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent"
        />
        <button className="btn-primary px-4 py-2 text-sm" type="submit">
          Chercher
        </button>
      </form>

      {message && <p className="text-sm text-zinc-300 mb-4">{message}</p>}
      {loading && <p className="text-zinc-500 text-sm">Recherche en cours...</p>}
      {!loading && results.length > 0 && (
        <p className="text-xs text-zinc-500 mb-4">
          Clique sur une affiche pour voir sa fiche complète, ou sur "+ Suivre" pour l'ajouter direct à tes séries.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((item) => (
          <ShowCard
            key={item.tmdb_id}
            item={item}
            onClick={() => openDetail(item)}
            onAdd={() => addToTracking(item)}
            added={addedIds.has(item.tmdb_id)}
            footer={opening === item.tmdb_id && <p className="text-[11px] text-accent mt-1">Ouverture...</p>}
          />
        ))}
      </div>
    </div>
  );
}
