import { useI18n } from '../i18n/LanguageContext.jsx';
import RatingStars from './RatingStars.jsx';

// Case à cocher ambre, dans le style du site.
function Checkbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
        checked ? 'border-signal bg-signal text-signal-ink' : 'border-ink-muted/50 hover:border-signal'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// Une ligne d'épisode : case, numéro et titre, date de diffusion, revisionnage et note.
export default function EpisodeRow({ episode, onToggleWatched, onRate, onRewatch }) {
  const { t, locale } = useI18n();
  const airDate = episode.air_date
    ? new Date(`${episode.air_date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex items-center gap-4 border-b border-ink-line px-4 py-3 last:border-0">
      <Checkbox checked={episode.watched} onChange={(checked) => onToggleWatched(episode.id, checked)} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-paper">
          <span className="tabular-nums text-ink-muted">E{episode.episode_number}</span>
          {episode.title && <span className="text-paper/90"> · {episode.title}</span>}
        </p>
        {airDate && <p className="mt-0.5 text-xs text-ink-muted">{airDate}</p>}
      </div>

      {episode.watched && onRewatch && (
        <button
          type="button"
          onClick={() => onRewatch(episode.id)}
          title={t('detail.rewatch')}
          aria-label={t('detail.rewatch')}
          className="flex shrink-0 items-center gap-1 text-xs text-ink-muted transition-colors hover:text-signal"
        >
          <span aria-hidden="true">↻</span>
          {episode.watch_count > 1 && <span className="tabular-nums">×{episode.watch_count}</span>}
        </button>
      )}

      <RatingStars value={episode.rating} onChange={(val) => onRate(episode.id, val)} />
    </div>
  );
}
