import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';
import RatingStars from '../components/RatingStars.jsx';

const TABS = ['all', 'to_watch', 'watched'];

// Mes films : même identité que Mes séries. Coche « vu » dans le coin de l'affiche, notation et retrait dessous.
export default function MyMovies() {
  const { t } = useI18n();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const load = () => {
    client.get('/movies').then((res) => setMovies(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleWatched = async (id, watched) => {
    await client.patch(`/movies/${id}/watched`, { watched });
    load();
  };

  const rate = async (id, rating) => {
    await client.post(`/movies/${id}/rating`, { rating });
    load();
  };

  const remove = async (id) => {
    if (!confirm(t('myMovies.confirmRemove'))) return;
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

  const trimmed = query.trim();
  const countFor = (key) =>
    key === 'all' ? movies.length : movies.filter((m) => (key === 'watched' ? m.watched : !m.watched)).length;
  const filtered = movies
    .filter((m) => (tab === 'all' ? true : tab === 'watched' ? m.watched : !m.watched))
    .filter((m) => m.title.toLowerCase().includes(trimmed.toLowerCase()));

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('myMovies.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('myMovies.title')}
          </h1>
        </header>

        <div className="animate-rise relative mt-10 max-w-md" style={{ animationDelay: '120ms' }}>
          <label htmlFor="my-movies-search" className="sr-only">
            {t('myMovies.searchPlaceholder')}
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
              id="my-movies-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('myMovies.searchPlaceholder')}
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
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-signal bg-signal/10 text-signal'
                    : 'border-ink-line text-ink-muted hover:border-signal/60 hover:text-paper'
                }`}
              >
                {t(`myMovies.tabs.${key}`)}
                <span className="ml-2 tabular-nums opacity-60">{countFor(key)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          {filtered.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">
              {trimmed ? t('myMovies.noMatch', { query: trimmed }) : t('myMovies.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((movie, i) => {
                const year = (movie.release_date || '').slice(0, 4);
                const meta = [year, movie.runtime ? t('myMovies.minutes', { count: movie.runtime }) : '']
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <PosterCard
                    key={movie.id}
                    title={movie.title}
                    year={meta}
                    posterUrl={movie.poster_url}
                    to={`/movie/${movie.id}`}
                    delay={Math.min(i, 12) * 50}
                    cornerBadge={
                      <button
                        type="button"
                        onClick={() => toggleWatched(movie.id, !movie.watched)}
                        aria-pressed={movie.watched}
                        aria-label={movie.watched ? t('myMovies.unmarkWatched') : t('myMovies.markWatched')}
                        title={movie.watched ? t('myMovies.unmarkWatched') : t('myMovies.markWatched')}
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
                        <RatingStars value={movie.rating} onChange={(val) => rate(movie.id, val)} />
                        <button
                          type="button"
                          onClick={() => remove(movie.id)}
                          className="text-xs text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
                        >
                          {t('myMovies.remove')}
                        </button>
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
