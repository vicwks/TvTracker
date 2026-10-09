import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import RatingStars from '../components/RatingStars.jsx';
import Dialog from '../components/Dialog.jsx';

// Fiche d'un film : même mise en page qu'avant, dans le style du site.
export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [movie, setMovie] = useState(null);
  const [note, setNote] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = () => {
    client.get(`/movies/${id}`).then((res) => {
      setMovie(res.data);
      setNote(res.data.note || '');
    });
  };

  useEffect(load, [id]);

  if (!movie) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

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
    setConfirmRemove(false);
    await client.delete(`/movies/${id}`);
    navigate('/watchlist');
  };

  const meta = [
    (movie.release_date || '').slice(0, 4),
    movie.runtime ? t('detail.minutes', { count: movie.runtime }) : '',
    movie.genres,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      {movie.backdrop_url && (
        <div className="relative h-56 overflow-hidden sm:h-72" aria-hidden="true">
          <img src={movie.backdrop_url} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        </div>
      )}

      <div className={`mx-auto max-w-5xl px-6 pb-20 sm:px-8 ${movie.backdrop_url ? '-mt-40 sm:-mt-48' : 'pt-14'}`}>
        <div className="relative flex items-start gap-8">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="aspect-[2/3] w-36 shrink-0 rounded-md object-cover ring-1 ring-ink-line shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)] sm:w-52"
            />
          )}

          <div className="min-w-0 flex-1 pt-2 sm:pt-16">
            <h1 className="animate-rise font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              {movie.title}
            </h1>
            {meta && <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-muted">{meta}</p>}
            <p className="mt-4 max-w-2xl leading-relaxed text-paper/75">{movie.overview}</p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={toggleWatched}
                aria-pressed={movie.watched}
                className={`rounded-md px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 active:scale-[0.98] ${
                  movie.watched
                    ? 'bg-signal text-signal-ink'
                    : 'border border-ink-line text-paper hover:border-signal hover:text-signal'
                }`}
              >
                {movie.watched ? t('detail.movieWatched') : t('detail.markWatched')}
              </button>
              <RatingStars value={movie.rating} onChange={rate} />
              {/* Suppression à droite, sur la même ligne que le bouton « vu » et la note. */}
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="ml-auto text-sm text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
              >
                {t('detail.delete')}
              </button>
            </div>
          </div>
        </div>

        {confirmRemove && (
          <Dialog
            title={t('dialog.deleteMovieTitle')}
            onClose={() => setConfirmRemove(false)}
            actions={[
              { label: t('common.cancel'), onClick: () => setConfirmRemove(false), primary: true },
              { label: t('detail.delete'), onClick: remove, danger: true },
            ]}
          >
            {t('detail.confirmRemoveMovie')}
          </Dialog>
        )}

        <section className="mt-16 max-w-3xl">
          <label htmlFor="movie-note" className="block font-display text-2xl font-medium">
            {t('detail.notes')}
          </label>
          <textarea
            id="movie-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            rows={4}
            placeholder={t('detail.notesPlaceholder')}
            className="mt-4 w-full resize-y rounded-md border border-ink-line bg-ink-soft p-4 text-[15px] leading-relaxed text-paper placeholder:text-ink-muted/60 transition-colors focus:border-signal focus:outline-none"
          />
        </section>
      </div>
    </div>
  );
}
