export default function RatingStars({ value, onChange, max = 5 }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  // value est sur 10 (base de données), on affiche sur "max" étoiles (défaut 5)
  const currentStar = value ? Math.round((value / 10) * max) : 0;

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange((star / max) * 10)}
          className={`text-lg leading-none ${
            star <= currentStar ? 'text-yellow-400' : 'text-zinc-600'
          } hover:text-yellow-300 transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
