import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';

const TYPES = ['shows', 'movies'];

// Rechercher : même identité que Découvrir (titre en Fraunces, champ souligné, cartes d'affiches).
export default function Search() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());
  const [opening, setOpening] = useState(null);

  const search = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const { data } = await client.get(`/search/${type}`, { params: { q: query } });
      setResults(data);
      setLastQuery(query.trim());
      setSearched(true);
      setAddedIds(new Set());
    } catch {
      setMessage(t('search.error'));
    } finally {
      setLoading(false);
    }
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

  // Ouvre la fiche détaillée de la série/film cliqué, même s'il n'est pas encore suivi
  // (on le met juste en cache localement pour pouvoir afficher sa page).
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

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('search.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('search.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('search.subtitle')}</p>
        </header>

        <form onSubmit={search} className="animate-rise mt-10 max-w-2xl" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-4 border-b border-ink-line transition-colors focus-within:border-signal">
            <div role="tablist" className="flex shrink-0 gap-3 text-xs uppercase tracking-[0.18em]">
              {TYPES.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="tab"
                  aria-selected={type === kind}
                  onClick={() => setType(kind)}
                  className={`transition-colors ${type === kind ? 'text-signal' : 'text-ink-muted hover:text-paper'}`}
                >
                  {t(`search.${kind}`)}
                </button>
              ))}
            </div>
            <label htmlFor="search-query" className="sr-only">
              {t('search.placeholder')}
            </label>
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {message && (
          <p role="alert" className="mt-8 text-sm text-danger">
            {message}
          </p>
        )}

        {loading && <p className="mt-8 animate-pulse text-sm text-ink-muted">{t('search.searching')}</p>}

        {!loading && searched && results.length === 0 && (
          <p className="mt-8 border-l border-signal/60 pl-4 text-sm text-ink-muted">
            {t('search.noResult', { query: lastQuery })}
          </p>
        )}

        {!loading && !searched && (
          <p className="mt-8 text-sm text-ink-muted">{t('search.idle')}</p>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mt-8 text-xs text-ink-muted">{t('search.hint')}</p>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.map((item, i) => (
                <PosterCard
                  key={item.tmdb_id}
                  title={item.title}
                  year={(item.first_air_date || item.release_date || '').slice(0, 4)}
                  posterUrl={item.poster_url}
                  delay={Math.min(i, 12) * 50}
                  onOpen={() => openDetail(item)}
                  footer={
                    opening === item.tmdb_id ? (
                      <p className="text-sm text-ink-muted">{t('discover.opening')}</p>
                    ) : addedIds.has(item.tmdb_id) ? (
                      <p className="text-sm text-signal">✓ {t('card.followed')}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToTracking(item)}
                        className="text-sm text-signal underline-offset-4 hover:underline"
                      >
                        {t('card.follow')}
                      </button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
