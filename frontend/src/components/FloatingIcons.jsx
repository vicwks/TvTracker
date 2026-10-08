import { ICONS } from '../assets/icons.js';

// Icônes de télé et de cinéma qui dérivent très lentement derrière le formulaire.
// Positions fixes (pas d'aléatoire) : le rendu est identique à chaque chargement.
// Décoratif : masqué aux lecteurs d'écran, sans effet sur le clic (pointer-events désactivés).
// Placées dans les marges (gauche, droite, haut et bas) : le formulaire au centre reste lisible.
const FLOATERS = [
  { icon: 'tv', top: 6, left: 8, size: 46, duration: 20, delay: 0 },
  { icon: 'film', top: 14, left: 84, size: 34, duration: 17, delay: 4 },
  { icon: 'popcorn', top: 30, left: 16, size: 40, duration: 23, delay: 9 },
  { icon: 'clapperboard', top: 40, left: 86, size: 44, duration: 19, delay: 2 },
  { icon: 'ticket', top: 56, left: 5, size: 36, duration: 21, delay: 12 },
  { icon: 'star', top: 66, left: 80, size: 24, duration: 16, delay: 6 },
  { icon: 'play', top: 78, left: 13, size: 30, duration: 18, delay: 14 },
  { icon: 'video', top: 84, left: 84, size: 38, duration: 22, delay: 3 },
  { icon: 'glasses', top: 4, left: 50, size: 32, duration: 24, delay: 10 },
  { icon: 'monitor-play', top: 8, left: 66, size: 30, duration: 17, delay: 7 },
  { icon: 'projector', top: 48, left: 92, size: 34, duration: 20, delay: 15 },
  { icon: 'camera', top: 90, left: 40, size: 34, duration: 19, delay: 1 },
  { icon: 'tv-minimal', top: 32, left: 3, size: 28, duration: 25, delay: 8 },
  { icon: 'ghost', top: 70, left: 92, size: 30, duration: 18, delay: 11 },
  { icon: 'sparkles', top: 90, left: 62, size: 26, duration: 21, delay: 5 },
  { icon: 'film', top: 86, left: 6, size: 28, duration: 16, delay: 13 },
  { icon: 'popcorn', top: 10, left: 90, size: 28, duration: 22, delay: 16 },
  { icon: 'star', top: 24, left: 20, size: 20, duration: 15, delay: 4 },
];

export default function FloatingIcons() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
      {FLOATERS.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute animate-drift text-paper/[0.12] motion-reduce:animate-none"
          style={{
            top: `${f.top}%`,
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `-${f.delay}s`,
          }}
        >
          {ICONS[f.icon].map(([Tag, props], j) => (
            <Tag key={j} {...props} />
          ))}
        </svg>
      ))}
    </div>
  );
}
