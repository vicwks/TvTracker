import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import RatingStars from '../components/RatingStars.jsx';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [note, setNote] = useState('');

  const load = () => {
    client.get(`/movies/${id}`).then((res) => {
      setMovie(res.data);
      setNote(res.data.note || '');
    });
  };

  useEffect(load, [id]);

  if (!movie) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const toggleWatched = async () => {
    await client.patch(`/movies/${id}/watched`, { watched: !movie.watched });
    load();
  };

  const rate = async (rating) => {
    await client.post(`/movies/${id}/rating`, { rating });
    load();
  };

  const saveNote = async () => {
    await client.post(`/movies/${id}/note`, { content: note });
  };

  const remove = async () => {
    if (!confirm('Retirer ce film de ton suivi ?')) return;
    await client.delete(`/movies/${id}`);
    navigate('/movies');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {movie.backdrop_url && (
        <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden mb-[-4rem]">
          <img src={movie.backdrop_url} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>
      )}

      <div className="relative flex gap-6 mb-6 items-start">
        {movie.poster_url && (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-52 aspect-[2/3] object-cover rounded-xl shadow-lg shadow-black/40 shrink-0 ring-1 ring-zinc-800"
          />
        )}
        <div className="flex-1 pt-2">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{movie.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {(movie.release_date || '').slice(0, 4)}
            {movie.runtime ? ` · ${movie.runtime} min` : ''} {movie.genres ? `· ${movie.genres}` : ''}
          </p>
          <p className="text-sm text-zinc-400 mt-3">{movie.overview}</p>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={toggleWatched}
              className={`text-sm rounded-lg px-3 py-2 transition-colors ${
                movie.watched ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {movie.watched ? '✓ Vu' : 'Marquer comme vu'}
            </button>
            <RatingStars value={movie.rating} onChange={rate} />
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={remove} className="btn-danger text-xs px-3 py-1.5">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-200 mb-2">Notes personnelles</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          rows={4}
          placeholder="Tes impressions sur ce film..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
