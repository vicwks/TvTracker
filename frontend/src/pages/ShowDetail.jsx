import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import EpisodeRow from '../components/EpisodeRow.jsx';
import RatingStars from '../components/RatingStars.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusMenu from '../components/StatusMenu.jsx';
import Dialog from '../components/Dialog.jsx';

// Fiche d'une série : même mise en page qu'avant (affiche, progression, saisons repliables),
// dans le style du site. Les actions restent les mêmes.
export default function ShowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [show, setShow] = useState(null);
  const [openSeason, setOpenSeason] = useState(null);
  // Épisode coché alors que des épisodes précédents de la saison ne sont pas vus : demande à confirmer.
  const [bulk, setBulk] = useState(null);

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

  if (!show) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

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
        setBulk({ episodeId, episode, season, count: earlierUnwatched.length });
        return;
      }
    }
    await client.patch(`/episodes/${episodeId}/watched`, { watched });
    load();
  };

  // Choix de la fenêtre : tous les épisodes précédents, ou seulement celui coché. Annuler ne change rien.
  const applyBulk = async (includeEarlier) => {
    const pending = bulk;
    setBulk(null);
    if (includeEarlier) {
      await client.patch(`/episodes/season/${pending.season.id}/watched-up-to/${pending.episode.episode_number}`);
    } else {
      await client.patch(`/episodes/${pending.episodeId}/watched`, { watched: true });
    }
    load();
  };

  const rewatchEpisode = async (episodeId) => {
    await client.post(`/episodes/${episodeId}/rewatch`);
    load();
  };

  const undoRewatch = async (episodeId) => {
    await client.delete(`/episodes/${episodeId}/rewatch`);
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
    if (!confirm(t('detail.confirmDeleteShow'))) return;
    await client.delete(`/shows/${id}`);
    navigate('/watchlist');
  };

  const status = show.tracking_status || 'to_watch';

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      {show.backdrop_url && (
        <div className="relative h-56 overflow-hidden sm:h-72" aria-hidden="true">
          <img src={show.backdrop_url} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        </div>
      )}

      <div className={`mx-auto max-w-5xl px-6 pb-20 sm:px-8 ${show.backdrop_url ? '-mt-40 sm:-mt-48' : 'pt-14'}`}>
        <div className="relative flex items-start gap-8">
          {show.poster_url && (
            <img
              src={show.poster_url}
              alt={show.title}
              className="aspect-[2/3] w-36 shrink-0 rounded-md object-cover ring-1 ring-ink-line shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)] sm:w-52"
            />
          )}

          <div className="min-w-0 flex-1 pt-2 sm:pt-16">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="animate-rise font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
                {show.title}
              </h1>
              <StatusMenu status={status} onChange={changeStatus} size="md" />
            </div>
            {show.genres && (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-muted">{show.genres}</p>
            )}
            <p className="mt-4 line-clamp-4 max-w-2xl leading-relaxed text-paper/75">{show.overview}</p>

            <div className="mt-6">
              <RatingStars value={show.rating} onChange={rateShow} />
            </div>

            <div className="mt-6 max-w-sm">
              <ProgressBar value={watchedEpisodes} max={totalEpisodes} status={status} />
            </div>

            {nextEpisode && (
              <div className="mt-8 flex max-w-md items-center justify-between gap-4 border-l-2 border-signal pl-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">{t('detail.nextEpisode')}</p>
                  <p className="mt-1 truncate font-display text-lg text-paper">
                    S{nextEpisode.season_number}E{nextEpisode.episode_number}
                    {nextEpisode.title ? ` · ${nextEpisode.title}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWatched(nextEpisode.id, true)}
                  className="shrink-0 rounded-md bg-signal px-3.5 py-1.5 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {t('detail.markSeen')}
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <button
                type="button"
                onClick={deleteShow}
                className="text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
              >
                {t('detail.delete')}
              </button>
            </div>
          </div>
        </div>

        {bulk && (
          <Dialog
            title={t('detail.bulkTitle')}
            onClose={() => setBulk(null)}
            actions={[
              { label: t('detail.bulkOnly'), onClick: () => applyBulk(false) },
              { label: t('detail.bulkAll'), onClick: () => applyBulk(true), primary: true },
            ]}
          >
            {t('detail.bulkConfirm', { count: bulk.count, season: bulk.season.name })}
          </Dialog>
        )}

        <div className="mt-16">
          {show.seasons.map((season) => {
            const watchedCount = season.episodes.filter((e) => e.watched).length;
            const isOpen = openSeason === season.id;
            const allWatched = watchedCount === season.episodes.length;
            return (
              <div key={season.id} className="border-b border-ink-line first:border-t">
                <div className="flex items-center justify-between gap-4 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenSeason(isOpen ? null : season.id)}
                    aria-expanded={isOpen}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="font-display text-xl text-paper transition-colors group-hover:text-signal">
                      {t('detail.seasonProgress', { season: season.name, watched: watchedCount, total: season.episodes.length })}
                    </span>
                    <span aria-hidden="true" className="text-xs text-ink-muted">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => markSeasonWatched(season.id, !allWatched)}
                    className="shrink-0 text-xs text-signal underline-offset-4 hover:underline"
                  >
                    {allWatched ? t('detail.markSeasonUnwatched') : t('detail.markSeasonWatched')}
                  </button>
                </div>
                {isOpen && (
                  <div className="mb-4 border-t border-ink-line">
                    {season.episodes.map((ep) => (
                      <EpisodeRow
                        key={ep.id}
                        episode={ep}
                        onToggleWatched={(epId, watched) => toggleWatched(epId, watched, ep, season)}
                        onRate={rateEpisode}
                        onRewatch={rewatchEpisode}
                      onUndoRewatch={undoRewatch}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
