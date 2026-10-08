import { useEffect, useState } from 'react';
import client from '../api/client.js';

// Deux bandes d'affiches qui défilent en sens inverse, en boucle. Décoratif : masqué aux lecteurs d'écran.
// La liste est dupliquée dans chaque bande : avec une marge à droite (et non un gap), les deux moitiés
// ont la même largeur, ce qui rend le défilement continu sans saut.
export default function PosterWall({ className = '' }) {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    let active = true;
    client
      .get('/public/posters')
      .then(({ data }) => {
        if (active) setPosters(data);
      })
      // Sans affiches, la colonne reste simplement vide : le formulaire reste utilisable.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (posters.length === 0) return null;

  const rowA = posters;
  const rowB = [...posters].reverse();

  return (
    <div aria-hidden="true" className={`space-y-4 overflow-hidden ${className}`}>
      <Row items={rowA} />
      <Row items={rowB} reverse />
    </div>
  );
}

// Les bords de la bande s'estompent, pour que les affiches n'apparaissent pas ni ne disparaissent brutalement.
const EDGE_FADE = 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)';
const edgeFadeStyle = { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE };

function Row({ items, reverse = false }) {
  return (
    <div className="overflow-hidden" style={edgeFadeStyle}>
      <div
        className={`flex w-max animate-marquee motion-reduce:animate-none ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {items.map((poster) => (
              <figure key={`${copy}-${poster.type}-${poster.tmdb_id}`} className="mr-4 w-24 shrink-0 sm:w-36">
                <img
                  src={poster.poster_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full rounded-md object-cover ring-1 ring-ink-line"
                />
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
