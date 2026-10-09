import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import RatingStars from '../components/RatingStars.jsx';
import StatusMenu from '../components/StatusMenu.jsx';
import Pagination from '../components/Pagination.jsx';
import Dialog from '../components/Dialog.jsx';

// Nombre de titres par page (trois rangées de cinq sur grand écran).
const PER_PAGE = 15;
const SHOW_FILTERS = ['all', 'to_watch', 'watching', 'paused', 'completed', 'dropped'];
const MOVIE_FILTERS = ['all', 'to_watch', 'watched'];

// Watchlist : tout ce que l'on suit. Deux onglets, Séries et Films, avec leurs propres filtres de statut.
export default function Watchlist() {
  const { t, locale } = useI18n();
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  // Film à retirer : demande confirmation dans une fenêtre.
  const [removing, setRemoving] = useState(null);

  const load = () => {
    Promise.all([client.get('/shows'), client.get('/movies')])
      .then(([showsRes, moviesRes]) => {
        setShows(showsRes.data);
        setMovies(moviesRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeShowStatus = async (id, status) => {
    await client.patch(`/shows/${id}/status`, { status });
    load();
  };

  const toggleMovieWatched = async (id, watched) => {
    await client.patch(`/movies/${id}/watched`, { watched });
    load();
  };

  const rateMovie = async (id, rating) => {
    await client.post(`/movies/${id}/rating`, { rating });
    load();
  };

  const removeMovie = async () => {
    const { id } = removing;
    setRemoving(null);
    await client.delete(`/movies/${id}`);
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const filters = type === 'shows' ? SHOW_FILTERS : MOVIE_FILTERS;
  const all = type === 'shows' ? shows : movies;
  const matchesFilter = (item) => {
    if (filter === 'all') return true;
    if (type === 'shows') return item.status === filter;
    return filter === 'watched' ? item.watched : !item.watched;
  };
  const countFor = (key) => {
    if (key === 'all') return all.length;
    if (type === 'shows') return shows.filter((s) => s.status === key).length;
    return movies.filter((m) => (key === 'watched' ? m.watched : !m.watched)).length;
  };

  const trimmed = query.trim().toLowerCase();
  const entries = all
    .filter(matchesFilter)
    .filter((item) => item.title.toLowerCase().includes(trimmed))
    .sort((a, b) => a.title.localeCompare(b.title, locale));

  const pageCount = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visible = entries.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const changeType = (key) => {
    setType(key);
    window.scrollTo(0, 0);
    setFilter('all');
    setPage(1);
  };

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('watchlist.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('watchlist.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('watchlist.subtitle')}</p>
        </header>

        <div role="tablist" className="animate-rise mt-10 flex gap-8 border-b border-ink-line" style={{ animationDelay: '100ms' }}>
          {['shows', 'movies'].map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={type === kind}
              onClick={() => changeType(kind)}
              className={`relative -mb-px pb-3 font-display text-2xl transition-colors ${
                type === kind ? 'text-paper' : 'text-ink-muted hover:text-paper'
              }`}
            >
              {t(`watchlist.types.${kind}`)}
              <span className="ml-2 font-ui text-sm tabular-nums text-ink-muted">
                {kind === 'shows' ? shows.length : movies.length}
              </span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-signal transition-transform duration-300 ${
                  type === kind ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="animate-rise relative mt-8 max-w-md" style={{ animationDelay: '140ms' }}>
          <label htmlFor="watchlist-search" className="sr-only">
            {t('watchlist.searchPlaceholder')}
          </label>
          <div className="flex items-center gap-3 border-b border-ink-line transition-colors focus-within:border-signal">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-ink-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="watchlist-search"
              type="text"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder={t('watchlist.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="animate-rise mt-6 flex flex-wrap gap-2" style={{ animationDelay: '180ms' }}>
          {filters.map((key) => {
            const active = filter === key;
            const label = key === 'all'
              ? t(`watchlist.all.${type}`)
              : type === 'shows'
                ? t(`status.${key}`)
                : t(`watchlist.movieFilters.${key}`);
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeFilter(key)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-ink-line text-ink-muted hover:border-signal/60 hover:text-paper'
                }`}
              >
                {label}
                <span className="ml-2 tabular-nums opacity-60">{countFor(key)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          {entries.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">
              {trimmed ? t('watchlist.noMatch', { query: trimmed }) : t('watchlist.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {visible.map((item, i) =>
                type === 'shows' ? (
                  <ShowEntry
                    key={`show-${item.id}`}
                    show={item}
                    delay={Math.min(i, 12) * 50}
                    onStatusChange={changeShowStatus}
                  />
                ) : (
                  <MovieEntry
                    key={`movie-${item.id}`}
                    movie={item}
                    delay={Math.min(i, 12) * 50}
                    onWatchedChange={toggleMovieWatched}
                    onRate={rateMovie}
                    onRemove={setRemoving}
                  />
                )
              )}
            </div>
          )}
        </div>

        {removing && (
          <Dialog
            title={t('dialog.removeMovieTitle')}
            onClose={() => setRemoving(null)}
            actions={[
              { label: t('common.cancel'), onClick: () => setRemoving(null), primary: true },
              { label: t('watchlist.remove'), onClick: removeMovie, danger: true },
            ]}
          >
            {t('watchlist.confirmRemoveMovie')}
          </Dialog>
        )}

        <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}

function ShowEntry({ show, delay, onStatusChange }) {
  const { t } = useI18n();
  return (
    <PosterCard
      title={show.title}
      posterUrl={show.poster_url}
      to={`/show/${show.id}`}
      delay={delay}
      cornerBadge={<StatusMenu status={show.status} onChange={(status) => onStatusChange(show.id, status)} />}
      footer={<ProgressBar value={show.watched_episodes} max={show.total_episodes} status={show.status} />}
    />
  );
}

function MovieEntry({ movie, delay, onWatchedChange, onRate, onRemove }) {
  const { t } = useI18n();
  const year = (movie.release_date || '').slice(0, 4);
  const meta = [year, movie.runtime ? t('detail.minutes', { count: movie.runtime }) : ''].filter(Boolean).join(' · ');
  const label = movie.watched ? t('watchlist.unmarkWatched') : t('watchlist.markWatched');

  return (
    <PosterCard
      title={movie.title}
      year={meta}
      fixedTitleHeight={false}
      posterUrl={movie.poster_url}
      to={`/movie/${movie.id}`}
      delay={delay}
      cornerBadge={
        <button
          type="button"
          onClick={() => onWatchedChange(movie.id, !movie.watched)}
          aria-pressed={movie.watched}
          aria-label={label}
          title={label}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
            movie.watched
              ? 'border-signal bg-signal text-signal-ink'
              : 'border-paper/30 bg-ink/70 text-paper/80 backdrop-blur hover:border-signal hover:text-signal'
          }`}
        >
          ✓
        </button>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <RatingStars value={movie.rating} onChange={(val) => onRate(movie.id, val)} />
          <button
            type="button"
            onClick={() => onRemove(movie)}
            className="text-xs text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
          >
            {t('watchlist.remove')}
          </button>
        </div>
      }
    />
  );
}
