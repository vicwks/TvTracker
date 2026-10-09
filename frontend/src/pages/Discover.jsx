import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';

const TYPES = ['shows', 'movies'];

// Découvrir : tendances, genres et recherche sur une même page. Une recherche remplace la liste des
// tendances (les genres ne s'y appliquent pas) ; vider le champ revient aux tendances.
export default function Discover() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [mode, setMode] = useState('trending'); // "trending" | id de genre
  const [query, setQuery] = useState(''); // ce qui est tapé dans le champ
  const [search, setSearch] = useState(''); // dernière recherche validée ; vide = pas de recherche
  const [genres, setGenres] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    client.get(`/discover/genres/${type}`).then((res) => setGenres(res.data));
    setMode('trending');
  }, [type]);

  useEffect(() => {
    // Ignore une réponse arrivée après un changement de type, de genre ou de recherche.
    let current = true;
    setLoading(true);
    let request;
    if (search) {
      request = client.get(`/search/${type}`, { params: { q: search } });
    } else {
      const url = mode === 'trending' ? `/discover/trending/${type}` : `/discover/by-genre/${type}/${mode}`;
      request = client.get(url);
    }
    request
      .then((res) => {
        if (!current) return;
        setItems(res.data);
        setAddedIds(new Set());
      })
      .catch(() => {
        if (current && search) setMessage(t('search.error'));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, mode, search]);

  const submitSearch = (e) => {
    e.preventDefault();
    setMessage('');
    setSearch(query.trim());
  };

  const changeQuery = (value) => {
    setQuery(value);
    if (!value.trim()) setSearch('');
  };

  const clearSearch = () => {
    setQuery('');
    setSearch('');
  };

  const addToTracking = async (item) => {
    try {
      if (type === 'shows') {
        await client.post('/shows', { tmdb_id: item.tmdb_id, status: 'to_watch' });
      } else {
        await client.post('/movies', { tmdb_id: item.tmdb_id });
      }
      setAddedIds((prev) => new Set(prev).add(item.tmdb_id));
    } catch {
      setMessage(t('discover.addError'));
    }
  };

  // Ouvre la fiche de la série/film cliqué, même s'il n'est pas encore suivi.
  const openDetail = async (item) => {
    setOpening(item.tmdb_id);
    try {
      const endpoint = type === 'shows' ? '/shows/resolve' : '/movies/resolve';
      const { data } = await client.get(`${endpoint}/${item.tmdb_id}`);
      navigate(type === 'shows' ? `/show/${data.id}` : `/movie/${data.id}`);
    } catch {
      setMessage(t('discover.openError'));
      setOpening(null);
    }
  };

  const searching = search !== '';

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('discover.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('discover.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('discover.subtitle')}</p>
        </header>

        <form onSubmit={submitSearch} className="animate-rise mt-10 max-w-2xl" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4 border-b border-ink-line transition-colors focus-within:border-signal">
            <label htmlFor="discover-search" className="sr-only">
              {t('search.placeholder')}
            </label>
            <input
              id="discover-search"
              type="text"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-signal px-4 py-1.5 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(245,165,36,0.7)] active:scale-[0.98]"
            >
              {t('search.submit')}
            </button>
          </div>
        </form>

        <div role="tablist" className="animate-rise mt-10 flex gap-8 border-b border-ink-line" style={{ animationDelay: '180ms' }}>
          {TYPES.map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={type === kind}
              onClick={() => setType(kind)}
              className={`relative -mb-px pb-3 font-display text-2xl transition-colors ${
                type === kind ? 'text-paper' : 'text-ink-muted hover:text-paper'
              }`}
            >
              {t(`discover.${kind}`)}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-signal transition-transform duration-300 ${
                  type === kind ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </div>

        {searching ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
            <p className="text-ink-muted">{items.length > 0 ? t('search.hint') : ''}</p>
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 text-signal underline-offset-4 hover:underline"
            >
              {t('discover.clearSearch')}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip active={mode === 'trending'} onClick={() => setMode('trending')}>
              {t('discover.trending')}
            </Chip>
            {genres.map((g) => (
              <Chip key={g.id} active={mode === g.id} onClick={() => setMode(g.id)}>
                {g.name}
              </Chip>
            ))}
          </div>
        )}

        {message && (
          <p role="alert" className="mt-8 text-sm text-danger">
            {message}
          </p>
        )}

        <div className="mt-10">
          {loading ? (
            <p className="animate-pulse text-sm text-ink-muted">
              {searching ? t('search.searching') : t('common.loading')}
            </p>
          ) : items.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">
              {searching ? t('search.noResult', { query: search }) : t('discover.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item, i) => (
                <PosterCard
                  key={item.tmdb_id}
                  title={item.title}
                  year={(item.first_air_date || item.release_date || '').slice(0, 4)}
                  posterUrl={item.poster_url}
                  friends={item.friendsWatching}
                  fixedTitleHeight={false}
                  delay={Math.min(i, 12) * 50}
                  onOpen={() => openDetail(item)}
                  footer={
                    opening === item.tmdb_id ? (
                      <p className="text-sm text-ink-muted">{t('discover.opening')}</p>
                    ) : addedIds.has(item.tmdb_id) ? (
                      <p className="w-full rounded-md border border-signal/60 py-2 text-center text-sm text-signal">
                        ✓ {t('card.followed')}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToTracking(item)}
                        className="w-full rounded-md bg-signal py-2 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(245,165,36,0.7)] active:scale-[0.98]"
                      >
                        {t('card.follow')}
                      </button>
                    )
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

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? 'border-signal bg-signal/10 text-signal'
          : 'border-ink-line text-ink-muted hover:border-signal/60 hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}
