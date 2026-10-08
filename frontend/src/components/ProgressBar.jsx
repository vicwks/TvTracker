import { STATUS_CONFIG } from '../constants/status.js';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Progression d'une série : fine barre dans la couleur du statut, texte « vus / total » dessous.
export default function ProgressBar({ value, max, status = 'watching', className = '' }) {
  const { t } = useI18n();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = STATUS_CONFIG[status]?.bar || STATUS_CONFIG.watching.bar;

  return (
    <div className={`w-full ${className}`}>
      <div className="h-1 w-full overflow-hidden rounded-full bg-ink-line">
        <div className={`${barColor} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] tabular-nums text-ink-muted">
        {t('progress.episodes', { count: max, value, max, pct })}
      </p>
    </div>
  );
}
