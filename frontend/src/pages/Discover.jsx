import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';

const TYPES = ['shows', 'movies'];

// Découvrir : même identité que le tableau de bord (titre en Fraunces, onglets soulignés, affiches sobres).
export default function Discover() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [type, setType] = useState('shows'); // "shows" | "movies"
  const [mode, setMode] = useState('trending'); // "trending" | id de genre
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
    setLoading(true);
    const url = mode === 'trending' ? `/discover/trending/${type}` : `/discover/by-genre/${type}/${mode}`;
    client
      .get(url)
      .then((res) => {
        setItems(res.data);
        setAddedIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [type, mode]);

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
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('discover.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('discover.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('discover.subtitle')}</p>
        </header>

        <div role="tablist" className="animate-rise mt-10 flex gap-8 border-b border-ink-line" style={{ animationDelay: '120ms' }}>
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

        {message && (
          <p role="alert" className="mt-8 text-sm text-danger">
            {message}
          </p>
        )}

        <div className="mt-10">
          {loading ? (
            <p className="animate-pulse text-sm text-ink-muted">{t('common.loading')}</p>
          ) : items.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">{t('discover.empty')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item, i) => (
                <PosterCard
                  key={item.tmdb_id}
                  title={item.title}
                  year={(item.first_air_date || item.release_date || '').slice(0, 4)}
                  posterUrl={item.poster_url}
                  friends={item.friendsWatching}
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
