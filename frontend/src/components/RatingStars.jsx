import { useI18n } from '../i18n/LanguageContext.jsx';

// Notes en étoiles, en ambre. La valeur est stockée sur 10 et affichée sur `max` étoiles (défaut 5).
export default function RatingStars({ value, onChange, max = 5 }) {
  const { t } = useI18n();
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const currentStar = value ? Math.round((value / 10) * max) : 0;

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange((star / max) * 10)}
          aria-label={t('rating.label', { star, max })}
          className={`text-lg leading-none transition-colors ${
            star <= currentStar ? 'text-signal' : 'text-ink-muted/40'
          } hover:text-signal/70`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
