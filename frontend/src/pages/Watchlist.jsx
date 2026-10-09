import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import RatingStars from '../components/RatingStars.jsx';
import StatusMenu from '../components/StatusMenu.jsx';
import Pagination from '../components/Pagination.jsx';

// Nombre de titres par page (trois rangées de cinq sur grand écran).
const PER_PAGE = 15;
const TABS = ['all', 'shows', 'movies', 'later'];

// Watchlist : la bibliothèque complète. Séries suivies, films suivis et « à voir plus tard » sont dans
// une seule liste triée par titre. Les cartes d'une série ou d'un film ouvrent leur fiche.
export default function Watchlist() {
  const { t, locale } = useI18n();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [later, setLater] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    Promise.all([client.get('/shows'), client.get('/movies'), client.get('/watchlist')])
      .then(([showsRes, moviesRes, laterRes]) => {
        setShows(showsRes.data);
        setMovies(moviesRes.data);
        setLater(laterRes.data);
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

  const removeMovie = async (id) => {
    if (!confirm(t('watchlist.confirmRemoveMovie'))) return;
    await client.delete(`/movies/${id}`);
    load();
  };

  const removeLater = async (id) => {
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

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const includes = (tabKey) => tab === 'all' || tab === tabKey;
  const counts = {
    all: shows.length + movies.length + later.length,
    shows: shows.length,
    movies: movies.length,
    later: later.length,
  };

  const trimmed = query.trim();
  const entries = [
    ...(includes('shows') ? shows.map((s) => ({ kind: 'show', key: `show-${s.id}`, title: s.title, item: s })) : []),
    ...(includes('movies') ? movies.map((m) => ({ kind: 'movie', key: `movie-${m.id}`, title: m.title, item: m })) : []),
    ...(includes('later') ? later.map((w) => ({ kind: 'later', key: `later-${w.id}`, title: w.title, item: w })) : []),
  ]
    .filter((e) => (e.title || '').toLowerCase().includes(trimmed.toLowerCase()))
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', locale));

  const pageCount = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visible = entries.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const changeTab = (key) => {
    setTab(key);
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

        <div className="animate-rise relative mt-10 max-w-md" style={{ animationDelay: '120ms' }}>
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

        <div className="animate-rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: '180ms' }}>
          {TABS.map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => changeTab(key)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-ink-line text-ink-muted hover:border-signal/60 hover:text-paper'
                }`}
              >
                {t(`watchlist.tabs.${key}`)}
                <span className="ml-2 tabular-nums opacity-60">{counts[key]}</span>
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
              {visible.map((entry, i) => (
                <Entry
                  key={entry.key}
                  entry={entry}
                  delay={Math.min(i, 12) * 50}
                  onShowStatus={changeShowStatus}
                  onMovieWatched={toggleMovieWatched}
                  onMovieRate={rateMovie}
                  onMovieRemove={removeMovie}
                  onLaterStart={startTracking}
                  onLaterRemove={removeLater}
                />
              ))}
            </div>
          )}
        </div>

        <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}

// Une carte selon son type : série (statut et progression), film (vu et note), ou « à voir plus tard ».
function Entry({
  entry,
  delay,
  onShowStatus,
  onMovieWatched,
  onMovieRate,
  onMovieRemove,
  onLaterStart,
  onLaterRemove,
}) {
  const { t } = useI18n();
  const { kind, item } = entry;

  if (kind === 'show') {
    return (
      <PosterCard
        title={item.title}
        year={t('card.typeShow')}
        posterUrl={item.poster_url}
        to={`/show/${item.id}`}
        delay={delay}
        cornerBadge={<StatusMenu status={item.status} onChange={(status) => onShowStatus(item.id, status)} />}
        footer={
          <ProgressBar value={item.watched_episodes} max={item.total_episodes} status={item.status} />
        }
      />
    );
  }

  if (kind === 'movie') {
    const year = (item.release_date || '').slice(0, 4);
    const meta = [year, item.runtime ? t('detail.minutes', { count: item.runtime }) : ''].filter(Boolean).join(' · ');
    const label = item.watched ? t('watchlist.unmarkWatched') : t('watchlist.markWatched');
    return (
      <PosterCard
        title={item.title}
        year={meta}
        posterUrl={item.poster_url}
        to={`/movie/${item.id}`}
        delay={delay}
        cornerBadge={
          <button
            type="button"
            onClick={() => onMovieWatched(item.id, !item.watched)}
            aria-pressed={item.watched}
            aria-label={label}
            title={label}
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
              item.watched
                ? 'border-signal bg-signal text-signal-ink'
                : 'border-paper/30 bg-ink/70 text-paper/80 backdrop-blur hover:border-signal hover:text-signal'
            }`}
          >
            ✓
          </button>
        }
        footer={
          <div className="flex items-center justify-between gap-2">
            <RatingStars value={item.rating} onChange={(val) => onMovieRate(item.id, val)} />
            <button
              type="button"
              onClick={() => onMovieRemove(item.id)}
              className="text-xs text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
            >
              {t('watchlist.remove')}
            </button>
          </div>
        }
      />
    );
  }

  // « À voir plus tard » : pas encore de fiche locale, donc la carte n'est pas cliquable.
  return (
    <PosterCard
      title={item.title}
      year={item.target_type === 'show' ? t('card.typeShow') : t('card.typeMovie')}
      posterUrl={item.poster_url}
      delay={delay}
      footer={
        <div className="flex items-center justify-between gap-2 text-sm">
          <button type="button" onClick={() => onLaterStart(item)} className="text-signal underline-offset-4 hover:underline">
            {t('watchlist.start')}
          </button>
          <button
            type="button"
            onClick={() => onLaterRemove(item.id)}
            className="text-xs text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
          >
            {t('watchlist.remove')}
          </button>
        </div>
      }
    />
  );
}
