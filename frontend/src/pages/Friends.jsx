import { useEffect, useState } from 'react';
import client from '../api/client.js';
import Avatar from '../components/Avatar.jsx';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([client.get('/friends'), client.get('/friends/requests'), client.get('/friends/sent')])
      .then(([f, r, s]) => {
        setFriends(f.data);
        setRequests(r.data);
        setSent(s.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const { data } = await client.get('/friends/search', { params: { q: query } });
    setResults(data);
  };

  const sendRequest = async (username) => {
    setMessage('');
    try {
      await client.post('/friends/request', { username });
      setMessage(`Demande envoyée à ${username} ✅`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de l'envoi de la demande");
    }
  };

  const accept = async (friendshipId) => {
    await client.post(`/friends/${friendshipId}/accept`);
    load();
  };

  const remove = async (friendshipId) => {
    await client.delete(`/friends/${friendshipId}`);
    load();
  };

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Amis</h1>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Ajouter un ami par pseudo</h2>
        <form onSubmit={search} className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un pseudo..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-accent"
          />
          <button className="btn-primary px-4 py-2 text-sm" type="submit">
            Chercher
          </button>
        </form>
        {message && <p className="text-xs text-zinc-400 mb-2">{message}</p>}
        <div className="space-y-2">
          {results.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Avatar user={u} size="w-8 h-8" />
              <span className="text-sm text-zinc-200 flex-1">
                {u.display_name} <span className="text-zinc-500">@{u.username}</span>
              </span>
              <button onClick={() => sendRequest(u.username)} className="btn-secondary text-xs px-3 py-1">
                Ajouter
              </button>
            </div>
          ))}
        </div>
      </div>

      {requests.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Demandes reçues</h2>
          <div className="space-y-2">
            {requests.map((u) => (
              <div key={u.friendship_id} className="flex items-center gap-3">
                <Avatar user={u} size="w-8 h-8" />
                <span className="text-sm text-zinc-200 flex-1">{u.display_name}</span>
                <button onClick={() => accept(u.friendship_id)} className="btn-primary text-xs px-3 py-1">
                  Accepter
                </button>
                <button onClick={() => remove(u.friendship_id)} className="btn-secondary text-xs px-3 py-1">
                  Refuser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Demandes envoyées</h2>
          <div className="space-y-2">
            {sent.map((u) => (
              <div key={u.friendship_id} className="flex items-center gap-3">
                <Avatar user={u} size="w-8 h-8" />
                <span className="text-sm text-zinc-200 flex-1">{u.display_name}</span>
                <span className="text-xs text-zinc-500">En attente...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="section-title mb-3">Mes amis ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-zinc-500 text-sm">Pas encore d'amis ajoutés.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {friends.map((f) => (
              <div key={f.id} className="card p-3 flex items-center gap-3">
                <Avatar user={f} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate">{f.display_name}</p>
                  <p className="text-xs text-zinc-500 truncate">@{f.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
