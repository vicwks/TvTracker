// Couleurs et ordre des statuts. Les libellés viennent du dictionnaire (clé `status.<statut>`).
export const STATUS_CONFIG = {
  to_watch: { dot: 'bg-zinc-400', bar: 'bg-zinc-400', badge: 'bg-zinc-800 text-zinc-300' },
  watching: { dot: 'bg-green-500', bar: 'bg-green-500', badge: 'bg-green-950 text-green-300' },
  paused: { dot: 'bg-amber-400', bar: 'bg-amber-400', badge: 'bg-amber-950 text-amber-300' },
  completed: { dot: 'bg-violet-400', bar: 'bg-violet-400', badge: 'bg-violet-950 text-violet-300' },
  dropped: { dot: 'bg-rose-400', bar: 'bg-rose-400', badge: 'bg-rose-950 text-rose-300' },
};

export const STATUS_ORDER = ['to_watch', 'watching', 'paused', 'completed', 'dropped'];
