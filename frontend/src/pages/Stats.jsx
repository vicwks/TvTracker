import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import client from '../api/client.js';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Durée en « X mois, Y j, Zh » : seules les unités utiles sont affichées.
function formatDuration(totalMinutes, t) {
  const totalHours = Math.floor(totalMinutes / 60);
  const months = Math.floor(totalHours / (24 * 30));
  const days = Math.floor((totalHours % (24 * 30)) / 24);
  const hours = totalHours % 24;

  const parts = [];
  if (months > 0) parts.push(t('stats.duration.months', { count: months }));
  if (days > 0) parts.push(t('stats.duration.days', { count: days }));
  if (hours > 0 || parts.length === 0) parts.push(t('stats.duration.hours', { count: hours }));
  return parts.join(', ');
}

// Statistiques : tout ce qui est compté a été réellement vu (épisodes cochés, films vus).
// Les données viennent de /stats, calculées côté serveur.
export default function Stats() {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    client
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error(err);
        const detail = err.response?.data?.details ? ` (${err.response.data.details})` : '';
        setError((err.response?.data?.error || t('stats.loadError')) + detail);
      });
  };

  useEffect(load, []);

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

  if (!stats) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center bg-ink font-ui text-ink-muted">
        <p className="animate-pulse text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const hours = Math.round(stats.totalMinutes / 60);
  const durationLabel = formatDuration(stats.totalMinutes, t);
  const hasViewing = stats.daysWatched > 0;

  const monthlyData = stats.monthly.map((m) => ({
    label: new Date(`${m.month}-01T00:00:00`).toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
    count: m.count,
  }));

  const maxGenreMinutes = Math.max(1, ...stats.genres.map((g) => g.minutes));
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' })
  );
  const weekdayFull = (i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'long' });
  const topWeekday = stats.weekdays.indexOf(Math.max(...stats.weekdays));
  const topHour = stats.hours.indexOf(Math.max(...stats.hours));

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('stats.kicker')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('stats.title')}
          </h1>
          <p className="mt-4 max-w-md text-ink-muted">{t('stats.subtitle')}</p>
        </header>

        {!hasViewing ? (
          <p className="mt-12 border-l border-signal/60 pl-4 text-sm text-ink-muted">{t('stats.empty')}</p>
        ) : (
          <>
            {/* En-tête : le temps total, puis quatre chiffres clés sur une seule bande. */}
            <section className="animate-rise mt-14 border-y border-ink-line py-12" style={{ animationDelay: '100ms' }}>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{t('stats.totalTime')}</p>
              <p className="mt-3 font-display text-5xl font-medium leading-none tracking-tight text-signal sm:text-7xl">
                {durationLabel}
              </p>
              <p className="mt-4 text-ink-muted">{t('stats.hoursTotal', { count: hours })}</p>

              <div className="mt-10 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:divide-x sm:divide-ink-line">
                <Stat value={stats.episodesWatched} label={t('stats.episodesWatched')} />
                <Stat value={stats.moviesWatched} label={t('stats.moviesWatched')} />
                <Stat value={stats.showsStarted} label={t('stats.showsStarted')} />
                <Stat value={stats.showsCompleted} label={t('stats.showsCompleted')} />
              </div>
            </section>

            <section className="animate-rise mt-16" style={{ animationDelay: '220ms' }}>
              <SectionTitle title={t('stats.monthly')} />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b2822" vertical={false} />
                    <XAxis dataKey="label" stroke="#9a9283" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9a9283" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(245, 165, 36, 0.08)' }}
                      contentStyle={{ background: '#171511', border: '1px solid #2b2822', borderRadius: 6, color: '#f4efe6' }}
                      labelStyle={{ color: '#f4efe6' }}
                      formatter={(value) => [value, t('stats.watchings')]}
                    />
                    <Bar dataKey="count" fill="#f5a524" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="mt-16 grid gap-14 lg:grid-cols-2">
              <section className="animate-rise" style={{ animationDelay: '280ms' }}>
                <SectionTitle title={t('stats.genres')} hint={t('stats.genresHint')} />
                {stats.genres.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('stats.nothing')}</p>
                ) : (
                  <ul className="space-y-5">
                    {stats.genres.map((g) => (
                      <li key={g.name}>
                        <div className="flex items-baseline justify-between gap-4 text-sm">
                          <span className="text-paper">{g.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                            {formatDuration(g.minutes, t)} · {t('stats.titlesCount', { count: g.count })}
                          </span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-line">
                          <div
                            className="h-full rounded-full bg-signal transition-all duration-700"
                            style={{ width: `${(g.minutes / maxGenreMinutes) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="animate-rise" style={{ animationDelay: '340ms' }}>
                <SectionTitle title={t('stats.topShows')} />
                {stats.topShows.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('stats.nothing')}</p>
                ) : (
                  <ol className="divide-y divide-ink-line border-y border-ink-line">
                    {stats.topShows.map((s, i) => (
                      <li key={s.id}>
                        <Link to={`/show/${s.id}`} className="group flex items-center gap-4 px-2 py-3 transition-colors hover:bg-ink-soft">
                          <span className="w-6 shrink-0 text-center font-display text-2xl tabular-nums text-signal/70">
                            {i + 1}
                          </span>
                          {s.poster_url ? (
                            <img src={s.poster_url} alt="" className="h-14 w-10 shrink-0 rounded-sm object-cover ring-1 ring-ink-line" />
                          ) : (
                            <div className="h-14 w-10 shrink-0 rounded-sm bg-ink-soft ring-1 ring-ink-line" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-lg text-paper">{s.title}</p>
                            <p className="mt-1 text-xs text-ink-muted">
                              {formatDuration(s.minutes, t)} · {t('stats.episodesCount', { count: s.episodes })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="mt-16 grid gap-14 lg:grid-cols-2">
              <section className="animate-rise" style={{ animationDelay: '400ms' }}>
                <SectionTitle title={t('stats.topMovies')} />
                {stats.topMovies.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('stats.noMovieRating')}</p>
                ) : (
                  <ol className="divide-y divide-ink-line border-y border-ink-line">
                    {stats.topMovies.map((m, i) => (
                      <li key={m.id}>
                        <Link to={`/movie/${m.id}`} className="group flex items-center gap-4 px-2 py-3 transition-colors hover:bg-ink-soft">
                          <span className="w-6 shrink-0 text-center font-display text-2xl tabular-nums text-signal/70">
                            {i + 1}
                          </span>
                          {m.poster_url ? (
                            <img src={m.poster_url} alt="" className="h-14 w-10 shrink-0 rounded-sm object-cover ring-1 ring-ink-line" />
                          ) : (
                            <div className="h-14 w-10 shrink-0 rounded-sm bg-ink-soft ring-1 ring-ink-line" />
                          )}
                          <p className="min-w-0 flex-1 truncate font-display text-lg text-paper">{m.title}</p>
                          <StarsDisplay value={m.rating / 2} locale={locale} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="animate-rise" style={{ animationDelay: '460ms' }}>
                <SectionTitle title={t('stats.rhythm')} />
                <BarStrip values={stats.weekdays} labels={weekdayNames} />
                <div className="mt-8">
                  <BarStrip values={stats.hours} labels={stats.hours.map((_, h) => (h % 6 === 0 ? String(h) : ''))} />
                </div>
                <p className="mt-6 text-sm text-ink-muted">
                  {t('stats.rhythmSentence', { weekday: weekdayFull(topWeekday), hour: topHour })}
                </p>

                <dl className="mt-10 divide-y divide-ink-line border-y border-ink-line">
                  <HabitRow label={t('stats.rewatches')} value={stats.rewatches} />
                  <HabitRow
                    label={t('stats.averageRating')}
                    value={
                      stats.averageRating === null ? (
                        <span className="text-sm text-ink-muted">{t('stats.noRating')}</span>
                      ) : (
                        <StarsDisplay value={stats.averageRating / 2} locale={locale} />
                      )
                    }
                  />
                  <HabitRow label={t('stats.daysWatched')} value={stats.daysWatched} />
                  <HabitRow
                    label={t('stats.longestStreak')}
                    value={t('stats.streakDays', { count: stats.longestStreak })}
                    caption={
                      stats.currentStreak > 0
                        ? t('stats.streakCaption', { count: stats.currentStreak })
                        : t('stats.streakNone')
                    }
                  />
                </dl>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Chiffre clé de la bande d'en-tête, centré, comme sur le tableau de bord.
function Stat({ value, label }) {
  return (
    <div className="text-center sm:px-6">
      <p className="font-display text-4xl font-medium tabular-nums text-paper sm:text-5xl">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink-muted">{label}</p>
    </div>
  );
}

// Une ligne de la liste « habitudes » : libellé à gauche, valeur à droite.
function HabitRow({ label, value, caption }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right font-display text-xl tabular-nums text-paper">
        {value}
        {caption && <span className="mt-0.5 block font-ui text-xs text-ink-muted">{caption}</span>}
      </dd>
    </div>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-ink-line pb-3">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="shrink-0 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

// Note sur 5 étoiles, valeur à une décimale près (arrondie à l'étoile la plus proche pour l'affichage).
function StarsDisplay({ value, locale }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-base leading-none" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? 'text-signal' : 'text-ink-muted/40'}>
            ★
          </span>
        ))}
      </span>
      <span className="text-sm tabular-nums text-ink-muted">
        {value.toLocaleString(locale, { maximumFractionDigits: 1 })}/5
      </span>
    </span>
  );
}

// Petites colonnes proportionnelles : jours de la semaine, heures de la journée.
function BarStrip({ values, labels }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-28 items-end gap-1.5">
      {values.map((value, i) => (
        <div key={i} className="flex h-full flex-1 flex-col justify-end gap-2">
          <div
            className="w-full rounded-t-sm bg-signal/80"
            style={{ height: `${value > 0 ? Math.max((value / max) * 100, 4) : 0}%` }}
            title={`${labels[i]} : ${value}`}
          />
          <span className="text-center text-[10px] uppercase tracking-[0.12em] text-ink-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
