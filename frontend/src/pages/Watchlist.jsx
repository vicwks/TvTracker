import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';
import PosterCard from '../components/PosterCard.jsx';

// Watchlist : même identité que Mes films. Les cartes ne sont pas cliquables : la liste ne donne pas
// l'identifiant local de la fiche, seulement l'identifiant TMDB.
export default function Watchlist() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    client.get('/watchlist').then((res) => setItems(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id) => {
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

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('watchlist.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('watchlist.title')}
          </h1>
        </header>

        <div className="mt-12">
          {items.length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">{t('watchlist.empty')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item, i) => (
                <PosterCard
                  key={item.id}
                  title={item.title}
                  year={item.target_type === 'show' ? t('card.typeShow') : t('card.typeMovie')}
                  posterUrl={item.poster_url}
                  delay={Math.min(i, 12) * 50}
                  footer={
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => startTracking(item)}
                        className="text-signal underline-offset-4 hover:underline"
                      >
                        {t('watchlist.start')}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="text-xs text-ink-muted underline-offset-4 transition hover:text-danger hover:underline"
                      >
                        {t('watchlist.remove')}
                      </button>
                    </div>
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
