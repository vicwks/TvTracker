import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import EpisodeRow from '../components/EpisodeRow.jsx';
import RatingStars from '../components/RatingStars.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusMenu from '../components/StatusMenu.jsx';

export default function ShowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [openSeason, setOpenSeason] = useState(null);

  const load = () => {
    client.get(`/shows/${id}`).then((res) => {
      setShow(res.data);
      if (openSeason === null && res.data.seasons.length > 0) {
        setOpenSeason(res.data.seasons[0].id);
      }
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!show) return <p className="p-8 text-zinc-500">Chargement...</p>;

  const allEpisodes = show.seasons.flatMap((s) =>
    s.episodes.map((e) => ({ ...e, season_number: s.season_number, season_id: s.id }))
  );
  const totalEpisodes = allEpisodes.length;
  const watchedEpisodes = allEpisodes.filter((e) => e.watched).length;
  const nextEpisode = allEpisodes.find((e) => !e.watched);

  // Si on coche un épisode comme vu et qu'il reste des épisodes antérieurs (même saison) non
  // vus, on propose de tout rattraper d'un coup plutôt que de forcer à cocher un par un.
  const toggleWatched = async (episodeId, watched, episode, season) => {
    if (watched && episode && season) {
      const earlierUnwatched = season.episodes.filter(
        (e) => e.episode_number < episode.episode_number && !e.watched
      );
      if (earlierUnwatched.length > 0) {
        const confirmBulk = window.confirm(
          `Marquer aussi les ${earlierUnwatched.length} épisode(s) précédent(s) de "${season.name}" comme vus ?`
        );
        if (confirmBulk) {
          await client.patch(`/episodes/season/${season.id}/watched-up-to/${episode.episode_number}`);
          load();
          return;
        }
      }
    }
    await client.patch(`/episodes/${episodeId}/watched`, { watched });
    load();
  };

  const rewatchEpisode = async (episodeId) => {
    await client.post(`/episodes/${episodeId}/rewatch`);
    load();
  };

  const rateEpisode = async (episodeId, rating) => {
    await client.post(`/episodes/${episodeId}/rating`, { rating });
    load();
  };

  const rateShow = async (rating) => {
    await client.post(`/shows/${id}/rating`, { rating });
    load();
  };

  const changeStatus = async (status) => {
    await client.patch(`/shows/${id}/status`, { status });
    load();
  };

  const markSeasonWatched = async (seasonId, watched) => {
    await client.patch(`/episodes/season/${seasonId}/watched-all`, { watched });
    load();
  };

  const deleteShow = async () => {
    if (!confirm('Supprimer cette série de ton suivi ?')) return;
    await client.delete(`/shows/${id}`);
    navigate('/shows');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {show.backdrop_url && (
        <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden mb-[-4rem]">
          <img src={show.backdrop_url} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>
      )}

      <div className="relative flex gap-6 mb-8 items-start">
        {show.poster_url && (
          <img
            src={show.poster_url}
            alt={show.title}
            className="w-52 aspect-[2/3] object-cover rounded-xl shadow-lg shadow-black/40 shrink-0 ring-1 ring-zinc-800"
          />
        )}
        <div className="flex-1 min-w-0 pt-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">{show.title}</h1>
            <StatusMenu status={show.tracking_status || 'to_watch'} onChange={changeStatus} size="md" />
          </div>
          <p className="text-sm text-zinc-500 mt-1">{show.genres}</p>
          <p className="text-sm text-zinc-400 mt-3 line-clamp-4">{show.overview}</p>

          <div className="mt-4">
            <RatingStars value={show.rating} onChange={rateShow} />
          </div>

          <div className="mt-4 max-w-xs">
            <ProgressBar
              value={watchedEpisodes}
              max={totalEpisodes}
              status={show.tracking_status || 'to_watch'}
            />
          </div>

          {nextEpisode && (
            <div className="mt-4 card p-3 flex items-center justify-between max-w-md">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Prochain épisode</p>
                <p className="text-sm font-medium text-zinc-100 truncate">
                  S{nextEpisode.season_number}E{nextEpisode.episode_number} — {nextEpisode.title}
                </p>
              </div>
              <button
                onClick={() => toggleWatched(nextEpisode.id, true)}
                className="btn-primary shrink-0 text-xs px-3 py-1.5 ml-3"
              >
                Marquer vu
              </button>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => client.post(`/shows/${id}/refresh`).then(load)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              🔄 Rafraîchir depuis TMDB
            </button>
            <button onClick={deleteShow} className="btn-danger text-xs px-3 py-1.5">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {show.seasons.map((season) => {
          const watchedCount = season.episodes.filter((e) => e.watched).length;
          const isOpen = openSeason === season.id;
          return (
            <div key={season.id} className="card">
              <button
                onClick={() => setOpenSeason(isOpen ? null : season.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/60 transition-colors"
              >
                <span className="font-medium text-sm text-zinc-100">
                  {season.name} <span className="text-zinc-500">({watchedCount}/{season.episodes.length})</span>
                </span>
                <span className="flex items-center gap-3">
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markSeasonWatched(season.id, watchedCount < season.episodes.length);
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    {watchedCount < season.episodes.length ? 'Tout marquer vu' : 'Tout marquer non vu'}
                  </span>
                  <span className="text-zinc-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-zinc-800">
                  {season.episodes.map((ep) => (
                    <EpisodeRow
                      key={ep.id}
                      episode={ep}
                      onToggleWatched={(epId, watched) => toggleWatched(epId, watched, ep, season)}
                      onRate={rateEpisode}
                      onRewatch={rewatchEpisode}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
