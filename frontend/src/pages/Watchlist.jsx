import { useEffect, useState } from 'react';
import client from '../api/client.js';
import ShowCard from '../components/ShowCard.jsx';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    client.get('/watchlist').then((res) => setItems(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id) => {
    await client.delete(`/watchlist/${id}`);
    load();
  };

  const startTracking = async (item) => {
    if (item.target_type === 'show') {
      await client.post('/shows', { tmdb_id: item.target_id, status: 'to_watch' });
    } else {
      await client.post('/movies', { tmdb_id: item.target_id });
    }
    await client.delete(`/watchlist/${item.id}`);
    load();
  };

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Ma watchlist</h1>
      {items.length === 0 ? (
        <p className="text-zinc-500 text-sm">Ta watchlist est vide.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <ShowCard
              key={item.id}
              item={item}
              footer={
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => startTracking(item)}
                    className="w-full text-xs bg-accent hover:bg-accent-dark text-zinc-950 rounded py-1"
                  >
                    Commencer le suivi
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="w-full text-xs bg-zinc-700 hover:bg-zinc-600 rounded py-1"
                  >
                    Retirer
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
