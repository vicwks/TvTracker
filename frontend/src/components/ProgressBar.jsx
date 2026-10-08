import { STATUS_CONFIG } from '../constants/status.js';

export default function ProgressBar({ value, max, status = 'watching', className = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = STATUS_CONFIG[status]?.bar || STATUS_CONFIG.watching.bar;

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-zinc-500 mt-1">
        {value}/{max} épisodes ({pct}%)
      </p>
    </div>
  );
}
