import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function CalendarPage() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/calendar?days=90').then((res) => setEpisodes(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const grouped = episodes.reduce((acc, ep) => {
    acc[ep.air_date] = acc[ep.air_date] || [];
    acc[ep.air_date].push(ep);
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6">Calendrier des sorties</h1>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-zinc-500 text-sm">
          Aucun épisode prévu. Assure-toi d'avoir des séries en "À voir" ou "En cours".
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, eps]) => (
            <div key={date}>
              <h2 className={`text-sm font-medium mb-2 ${date === today ? 'text-accent' : 'text-zinc-400'}`}>
                {date} {date === today && "— aujourd'hui"}
              </h2>
              <div className="space-y-1">
                {eps.map((ep) => (
                  <Link
                    key={ep.episode_id}
                    to={`/show/${ep.show_id}`}
                    className="flex items-center gap-3 bg-zinc-900 rounded-md p-2 hover:bg-zinc-800"
                  >
                    {ep.poster_url && (
                      <img src={ep.poster_url} alt="" className="w-8 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{ep.show_title}</p>
                      <p className="text-xs text-zinc-500">
                        S{ep.season_number}E{ep.episode_number} — {ep.episode_title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
