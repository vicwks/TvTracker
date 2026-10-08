import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Date du jour au format AAAA-MM-JJ, en heure locale (et non UTC).
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Calendrier : les épisodes à venir groupés par jour, même identité que « Prochains épisodes » du tableau de bord.
export default function CalendarPage() {
  const { t, locale } = useI18n();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/calendar?days=90').then((res) => setEpisodes(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const grouped = episodes.reduce((acc, ep) => {
    acc[ep.air_date] = acc[ep.air_date] || [];
    acc[ep.air_date].push(ep);
    return acc;
  }, {});

  const today = localToday();

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('calendar.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('calendar.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('calendar.subtitle')}</p>
        </header>

        <div className="mt-12">
          {Object.keys(grouped).length === 0 ? (
            <p className="border-l border-signal/60 pl-4 text-sm text-ink-muted">{t('calendar.empty')}</p>
          ) : (
            <div className="space-y-12">
              {Object.entries(grouped).map(([date, eps], i) => (
                <section key={date} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}>
                  <div className="flex items-baseline justify-between gap-4 border-b border-ink-line pb-3">
                    <h2 className="font-display text-2xl font-medium">{formatDay(date, locale)}</h2>
                    {date === today && (
                      <span className="text-xs uppercase tracking-[0.2em] text-signal">{t('calendar.today')}</span>
                    )}
                  </div>
                  <ul className="divide-y divide-ink-line">
                    {eps.map((ep) => (
                      <li key={ep.episode_id}>
                        <Link
                          to={`/show/${ep.show_id}`}
                          className="group flex items-center gap-5 px-2 py-4 transition-colors hover:bg-ink-soft"
                        >
                          {ep.poster_url ? (
                            <img
                              src={ep.poster_url}
                              alt=""
                              className="h-14 w-10 shrink-0 rounded-sm object-cover ring-1 ring-ink-line transition group-hover:ring-signal/60"
                            />
                          ) : (
                            <div className="h-14 w-10 shrink-0 rounded-sm bg-ink-soft ring-1 ring-ink-line" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-lg text-paper">{ep.show_title}</p>
                            <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-ink-muted">
                              {t('calendar.episode', { season: ep.season_number, episode: ep.episode_number })}
                              {ep.episode_title ? ` · ${ep.episode_title}` : ''}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// « lundi 12 octobre » → « Lundi 12 octobre » (ou « Monday 12 October » en anglais).
function formatDay(isoDate, locale) {
  const date = new Date(`${isoDate}T00:00:00`);
  const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
