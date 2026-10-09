import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Carrousel d'affiches en plein fond : colonne de gauche des pages de connexion et d'inscription.
// Il change tout seul, en boucle, sans commande. Le texte (enfants) est posé au-dessus.
const SLIDE_MS = 2500;
const TRANSITION_MS = 700;
// Voile sombre : foncé en bas (légende) et à gauche (titre), pour que le texte reste lisible sur toutes les affiches.
const VEIL_STYLE = {
  backgroundImage:
    'linear-gradient(to top, #0f0e0c 0%, rgba(15, 14, 12, 0.65) 45%, rgba(15, 14, 12, 0.25) 100%), linear-gradient(to right, rgba(15, 14, 12, 0.8), rgba(15, 14, 12, 0) 75%)',
};

export default function PosterSlider({ className = '', children }) {
  const [posters, setPosters] = useState([]);
  // `position` est la diapositive affichée. Elle peut atteindre `count` : c'est la copie de la première affiche,
  // ajoutée en fin de piste, qui rend le passage dernier -> premier identique à tous les autres.
  const [position, setPosition] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const { t } = useI18n();
  const count = posters.length;
  const hasPosters = count > 0;
  const slideCount = count + 1;

  useEffect(() => {
    let active = true;
    // fetch (et non axios) pour reprendre la requête préchargée par index.html.
    fetch('/api/public/posters')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('posters'))))
      .then((data) => {
        if (active) setPosters(data);
      })
      // Sans affiches, le panneau reste un aplat sombre avec son texte : le formulaire reste utilisable.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Une diapositive toutes les SLIDE_MS. En pause au survol, désactivé si l'utilisateur réduit les animations.
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setTimeout(() => {
      setAnimate(true);
      setPosition((p) => p + 1);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [count, position, paused]);

  // Sur la copie de la première affiche, une fois le glissement fini, on revient à la vraie première
  // sans animation : l'image est la même, le retour ne se voit pas.
  useEffect(() => {
    if (count < 2 || position !== count) return undefined;
    const timer = setTimeout(() => {
      setAnimate(false);
      setPosition(0);
    }, TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [count, position]);

  const shown = hasPosters ? posters[position % count] : null;
  const rank = hasPosters ? (position % count) + 1 : 0;

  return (
    <section
      aria-label={hasPosters ? t('auth.poster.aria') : undefined}
      className={`relative flex flex-col justify-between overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {hasPosters && (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div
            className="flex h-full"
            style={{
              width: `${slideCount * 100}%`,
              transform: `translateX(-${(position * 100) / slideCount}%)`,
              transition: animate ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
            }}
          >
            {[...posters, posters[0]].map((poster, i) => (
              <div key={`${i}-${poster.type}-${poster.tmdb_id}`} className="h-full" style={{ width: `${100 / slideCount}%` }}>
                <img
                  src={poster.poster_url}
                  alt=""
                  width={780}
                  height={1170}
                  // Seule la première affiche est chargée tout de suite (c'est elle qui s'affiche au départ).
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchpriority={i === 0 ? 'high' : 'auto'}
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

      {shown && (
        <div className="relative z-10 min-w-0">
          <p className="truncate font-display text-lg text-paper">{shown.title}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            {t('auth.poster.rank', { rank, type: t(`auth.types.${shown.type}`) })}
          </p>
        </div>
      )}
    </section>
  );
}
