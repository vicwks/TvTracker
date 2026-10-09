import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';
import StatusMenu from '../components/StatusMenu.jsx';
import Pagination from '../components/Pagination.jsx';

// Nombre de séries affichées par page dans « En cours de visionnage » (deux lignes sur grand écran).
const WATCHING_PER_PAGE = 10;

// Tableau de bord : même identité que les pages de connexion (encre chaude, Fraunces, ambre).
// Le style est local à cette page ; seuls StatusMenu et ProgressBar sont partagés.
export default function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [watchingPage, setWatchingPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      client.get('/shows'),
      client.get('/movies'),
      client.get('/calendar?days=14'),
      client.get('/stats'),
    ])
      .then(([showsRes, moviesRes, calRes, statsRes]) => {
        setShows(showsRes.data);
        setMovies(moviesRes.data);
        setCalendar(calRes.data.slice(0, 6));
        setStats(statsRes.data);
      })
      .catch((err) => {
        console.error(err);
        const detail = err.response?.data?.details ? ` (${err.response.data.details})` : '';
        setError((err.response?.data?.error || t('dashboard.loadError')) + detail);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (showId, status) => {
    await client.patch(`/shows/${showId}/status`, { status });
    load();
  };

  const watching = shows.filter((s) => s.status === 'watching');
  // Si une série sort de la liste (changement de statut), on reste sur une page qui existe.
  const watchingPageCount = Math.max(1, Math.ceil(watching.length / WATCHING_PER_PAGE));
  const currentWatchingPage = Math.min(watchingPage, watchingPageCount);
  const visibleWatching = watching.slice(
    (currentWatchingPage - 1) * WATCHING_PER_PAGE,
    currentWatchingPage * WATCHING_PER_PAGE
  );
  const hours = stats ? Math.round(stats.totalMinutes / 60) : 0;
  // Affiche de la première série en cours, en toile de fond discrète de l'en-tête.
  const backdrop = watching.find((s) => s.poster_url)?.poster_url;

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? [
        ...shows
          .filter((s) => s.title.toLowerCase().includes(q))
          .map((s) => ({ type: 'show', id: s.id, title: s.title, poster_url: s.poster_url })),
        ...movies
          .filter((m) => m.title.toLowerCase().includes(q))
          .map((m) => ({ type: 'movie', id: m.id, title: m.title, poster_url: m.poster_url })),
      ].slice(0, 8)
    : [];

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60dvh] bg-ink px-6 py-16 font-ui text-paper sm:px-8">
        <div className="mx-auto max-w-xl">
          <p className="font-display text-2xl">{t('common.oops')}</p>
          <p className="mt-3 text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-6 rounded-md border border-ink-line px-4 py-2 text-sm text-paper transition hover:border-signal hover:text-signal"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const displayName = user?.display_name || user?.username;

  return (
    <div className="min-h-screen bg-ink font-ui text-paper">
      {/* Pas de overflow-hidden ici : la liste de résultats de recherche doit déborder sous le bandeau. */}
      <header className="relative z-10 border-b border-ink-line">
        {backdrop && (
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <img src={backdrop} alt="" className="h-full w-full object-cover opacity-25 blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/85 to-ink" />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-14 sm:px-8 sm:pt-20">
          <p className="animate-rise text-xs uppercase tracking-[0.25em] text-ink-muted">{t('dashboard.kicker')}</p>
          <h1
            className="animate-rise mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl"
            style={{ animationDelay: '80ms' }}
          >
            {t('dashboard.greetingBefore')}{' '}
            <span className="italic text-signal">{displayName}</span>
            {t('dashboard.greetingAfter')}
          </h1>
          <p className="animate-rise mt-4 max-w-md text-ink-muted" style={{ animationDelay: '160ms' }}>
            {t('dashboard.subtitle')}
          </p>

          <div className="animate-rise relative mt-10 max-w-md" style={{ animationDelay: '240ms' }}>
            <label htmlFor="dashboard-search" className="sr-only">
              {t('dashboard.searchLabel')}
            </label>
            <div className="group flex items-center gap-3 border-b border-ink-line transition-colors focus-within:border-signal">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-focus-within:text-signal"
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
                id="dashboard-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('dashboard.searchLabel')}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
              />
            </div>

            {q && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-ink-line bg-ink-soft shadow-2xl shadow-black/50">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-ink-muted">{t('dashboard.noResult', { query })}</p>
                ) : (
                  searchResults.map((r) => (
                    <Link
                      key={`${r.type}-${r.id}`}
                      to={r.type === 'show' ? `/show/${r.id}` : `/movie/${r.id}`}
                      onClick={() => setQuery('')}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-ink"
                    >
                      {r.poster_url ? (
                        <img src={r.poster_url} alt="" className="h-11 w-8 shrink-0 rounded-sm object-cover" />
                      ) : (
                        <div className="h-11 w-8 shrink-0 rounded-sm bg-ink-line" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-display text-base text-paper">{r.title}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                        {r.type === 'show' ? t('dashboard.typeShow') : t('dashboard.typeMovie')}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-12 sm:px-8">
        {stats && (
          <section
            className="animate-rise grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-ink-line"
            style={{ animationDelay: '320ms' }}
          >
            <Stat value={t('dashboard.hours', { count: hours })} label={t('dashboard.stats.hours')} accent />
            <Stat value={watching.length} label={t('dashboard.stats.watching')} />
            <Stat value={stats.episodesWatched} label={t('dashboard.stats.episodes')} />
            <Stat value={stats.moviesWatched} label={t('dashboard.stats.movies')} />
          </section>
        )}

        <section>
          <SectionHeader
            title={t('dashboard.watching')}
            to="/watchlist"
            linkLabel={t('dashboard.allShows')}
          />

          {watching.length === 0 ? (
            <Empty>
              {t('dashboard.noWatching')}{' '}
              <Link to="/discover" className="text-signal underline-offset-4 hover:underline">
                {t('dashboard.findShow')}
              </Link>
              .
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visibleWatching.map((show, i) => (
                  <WatchCard
                    key={show.id}
                    show={show}
                    delay={i * 70}
                    onStatusChange={(status) => changeStatus(show.id, status)}
                  />
                ))}
              </div>
              <Pagination
                page={currentWatchingPage}
                pageCount={watchingPageCount}
                onChange={setWatchingPage}
              />
            </>
          )}
        </section>

        <section>
          <SectionHeader title={t('dashboard.upcoming')} to="/calendar" linkLabel={t('dashboard.fullCalendar')} />

          {calendar.length === 0 ? (
            <Empty>{t('dashboard.noUpcoming')}</Empty>
          ) : (
            <ul className="divide-y divide-ink-line border-y border-ink-line">
              {calendar.map((ep, i) => (
                <li key={ep.episode_id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <Link
                    to={`/show/${ep.show_id}`}
                    className="group flex items-center gap-5 px-2 py-4 transition-colors hover:bg-ink-soft"
                  >
                    {ep.poster_url ? (
                      <img
                        src={ep.poster_url}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded-sm object-cover ring-1 ring-ink-line transition group-hover:ring-signal/60"
                      />
                    ) : (
                      <div className="h-16 w-11 shrink-0 rounded-sm bg-ink-soft ring-1 ring-ink-line" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xl text-paper">{ep.show_title}</p>
                      <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-ink-muted">
                        {t('dashboard.episodeCode', { season: ep.season_number, episode: ep.episode_number })}
                        {ep.episode_title ? ` · ${ep.episode_title}` : ''}
                      </p>
                    </div>
                    <time
                      dateTime={ep.air_date}
                      className="shrink-0 text-sm tabular-nums text-signal transition-transform group-hover:-translate-x-1"
                    >
                      {formatDate(ep.air_date, locale)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(isoDate, locale) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 border-b border-ink-line pb-4">
      <h2 className="font-display text-3xl font-medium tracking-tight">{title}</h2>
      <Link to={to} className="shrink-0 text-sm text-signal underline-offset-4 hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

function Stat({ value, label, accent = false }) {
  return (
    <div className="text-center sm:px-6">
      <p className={`font-display text-4xl font-medium tabular-nums sm:text-5xl ${accent ? 'text-signal' : 'text-paper'}`}>
        {value}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</p>
    </div>
  );
}

function Empty({ children }) {
  return <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">{children}</p>;
}

function WatchCard({ show, delay, onStatusChange }) {
  const { t } = useI18n();
  const total = show.total_episodes || 0;
  const watched = show.watched_episodes || 0;
  const percent = total ? Math.min(100, Math.round((watched / total) * 100)) : 0;

  return (
    <article className="group relative animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <Link to={`/show/${show.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-ink-soft ring-1 ring-ink-line transition duration-500 group-hover:-translate-y-1 group-hover:ring-signal/60 group-hover:shadow-[0_18px_40px_-18px_rgba(245,165,36,0.55)]">
          {show.poster_url ? (
            <img
              src={show.poster_url}
              alt={show.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-ink-muted">
              {show.title}
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-1 font-display text-lg text-paper">{show.title}</h3>
        <p className="mt-1 text-xs tabular-nums text-ink-muted">
          {t('dashboard.episodesProgress', { count: total, watched, total })}
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-ink-line" aria-hidden="true">
          <div className="h-full rounded-full bg-signal transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <StatusMenu status={show.status} onChange={onStatusChange} />
      </div>
    </article>
  );
}
