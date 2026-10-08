import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatusMenu from '../components/StatusMenu.jsx';

const TABS = ['all', 'to_watch', 'watching', 'paused', 'completed', 'dropped'];

// Mes séries : même identité que Découvrir. Filtres par statut en pastilles, cartes d'affiches avec progression.
export default function MyShows() {
  const { t } = useI18n();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [recomputing, setRecomputing] = useState(false);

  const load = () => {
    client.get('/shows').then((res) => setShows(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const recomputeStatuses = async () => {
    setRecomputing(true);
    try {
      await client.post('/shows/recompute-status');
      load();
    } finally {
      setRecomputing(false);
    }
  };

  const changeStatus = async (showId, status) => {
    await client.patch(`/shows/${showId}/status`, { status });
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
  const filtered = shows
    .filter((s) => tab === 'all' || s.status === tab)
    .filter((s) => s.title.toLowerCase().includes(trimmed.toLowerCase()));

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('myShows.kicker')}</p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
              {t('myShows.title')}
            </h1>
          </div>
          <button
            type="button"
            onClick={recomputeStatuses}
            disabled={recomputing}
            title={t('myShows.recomputeHint')}
            className="text-sm text-signal underline-offset-4 transition hover:underline disabled:opacity-50"
          >
            {recomputing ? t('myShows.recomputing') : `${t('myShows.recompute')} →`}
          </button>
        </header>

        <div className="animate-rise relative mt-10 max-w-md" style={{ animationDelay: '120ms' }}>
          <label htmlFor="my-shows-search" className="sr-only">
            {t('myShows.searchPlaceholder')}
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
              id="my-shows-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('myShows.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="animate-rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: '180ms' }}>
          {TABS.map((key) => {
            const count = key === 'all' ? shows.length : shows.filter((s) => s.status === key).length;
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
                {t(`myShows.tabs.${key}`)}
                {key !== 'all' && <span className="ml-2 tabular-nums opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          {filtered.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">
              {trimmed ? t('myShows.noMatch', { query: trimmed }) : t('myShows.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((show, i) => (
                <PosterCard
                  key={show.id}
                  title={show.title}
                  posterUrl={show.poster_url}
                  to={`/show/${show.id}`}
                  delay={Math.min(i, 12) * 50}
                  cornerBadge={
                    <StatusMenu status={show.status} onChange={(status) => changeStatus(show.id, status)} />
                  }
                  footer={
                    <ProgressBar
                      value={show.watched_episodes}
                      max={show.total_episodes}
                      status={show.status}
                    />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
