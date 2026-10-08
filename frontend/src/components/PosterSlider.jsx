import { useEffect, useRef, useState } from 'react';
import client from '../api/client.js';

// Carrousel d'affiches en plein fond : c'est le panneau de gauche des pages de connexion et d'inscription.
// Il défile tout seul, s'arrête au survol ou au focus, et se fait glisser au doigt ou à la souris.
// Le texte (enfants) est posé au-dessus de l'image et du voile sombre.
const AUTOPLAY_MS = 6000;
const SWIPE_MIN_PX = 50;
const TYPE_LABELS = { show: 'Série', movie: 'Film' };
// Voile sombre : foncé en bas (légende) et à gauche (titre), pour que le texte reste lisible sur toutes les affiches.
const VEIL_STYLE = {
  backgroundImage:
    'linear-gradient(to top, #0f0e0c 0%, rgba(15, 14, 12, 0.65) 45%, rgba(15, 14, 12, 0.25) 100%), linear-gradient(to right, rgba(15, 14, 12, 0.8), rgba(15, 14, 12, 0) 75%)',
};

export default function PosterSlider({ className = '', children }) {
  const [posters, setPosters] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStartX = useRef(null);
  const count = posters.length;
  const hasPosters = count > 0;

  useEffect(() => {
    let active = true;
    client
      .get('/public/posters')
      .then(({ data }) => {
        if (active) setPosters(data);
      })
      // Sans affiches, le panneau reste un aplat sombre avec son texte : le formulaire reste utilisable.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Une affiche par intervalle. Le minuteur repart à chaque changement (flèche, point, glissement).
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [count, index, paused]);

  const goTo = (target) => setIndex(((target % count) + count) % count);

  const onPointerDown = (e) => {
    swipeStartX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) >= SWIPE_MIN_PX) goTo(index + (dx < 0 ? 1 : -1));
  };

  const current = hasPosters ? posters[index] : null;

  return (
    <section
      aria-roledescription={hasPosters ? 'carrousel' : undefined}
      aria-label={hasPosters ? 'Affiches de films et de séries' : undefined}
      className={`relative flex flex-col justify-between overflow-hidden touch-pan-y ${className}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {hasPosters && (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div
            className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${count * 100}%`, transform: `translateX(-${(index * 100) / count}%)` }}
          >
            {posters.map((poster, i) => (
              <div key={`${poster.type}-${poster.tmdb_id}`} className="h-full" style={{ width: `${100 / count}%` }}>
                <img
                  src={poster.poster_url}
                  alt=""
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0" style={VEIL_STYLE} />
        </div>
      )}

      <div className="relative z-10">{children}</div>

      {current && (
        <div className="relative z-10 flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-paper">{current.title}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{TYPE_LABELS[current.type]}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ArrowButton direction="prev" onClick={() => goTo(index - 1)} />
            <div className="hidden items-center sm:flex">
              {posters.map((poster, i) => (
                <button
                  key={`${poster.type}-${poster.tmdb_id}`}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Affiche ${i + 1} sur ${count}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="flex h-6 w-4 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                >
                  <span className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-signal' : 'w-1.5 bg-paper/40'}`} />
                </button>
              ))}
            </div>
            <ArrowButton direction="next" onClick={() => goTo(index + 1)} />
          </div>
        </div>
      )}
    </section>
  );
}

function ArrowButton({ direction, onClick }) {
  const previous = direction === 'prev';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={previous ? 'Affiche précédente' : 'Affiche suivante'}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-paper/25 text-paper transition hover:border-signal hover:text-signal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={previous ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  );
}
