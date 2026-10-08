import RatingStars from './RatingStars.jsx';

function Checkbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-colors ${
        checked ? 'bg-accent' : 'bg-zinc-800 border border-zinc-600 hover:border-zinc-400'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3 text-zinc-950">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export default function EpisodeRow({ episode, onToggleWatched, onRate, onRewatch }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-zinc-800 last:border-0">
      <Checkbox checked={episode.watched} onChange={(checked) => onToggleWatched(episode.id, checked)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="text-zinc-500">E{episode.episode_number}</span> — {episode.title}
        </p>
        {episode.air_date && <p className="text-xs text-zinc-500">{episode.air_date}</p>}
      </div>

      {episode.watched && onRewatch && (
        <button
          onClick={() => onRewatch(episode.id)}
          title="Marquer comme revu (nouveau visionnage)"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-accent transition-colors shrink-0"
        >
          <span>↻</span>
          {episode.watch_count > 1 && <span>×{episode.watch_count}</span>}
        </button>
      )}

      <RatingStars value={episode.rating} onChange={(val) => onRate(episode.id, val)} />
    </div>
  );
}
