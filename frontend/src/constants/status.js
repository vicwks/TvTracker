export const STATUS_CONFIG = {
  to_watch: { label: 'À voir', dot: 'bg-zinc-400', bar: 'bg-zinc-400', badge: 'bg-zinc-800 text-zinc-300' },
  watching: { label: 'En cours', dot: 'bg-emerald-400', bar: 'bg-emerald-400', badge: 'bg-emerald-950 text-emerald-300' },
  paused: { label: 'En pause', dot: 'bg-amber-400', bar: 'bg-amber-400', badge: 'bg-amber-950 text-amber-300' },
  completed: { label: 'Terminé', dot: 'bg-violet-400', bar: 'bg-violet-400', badge: 'bg-violet-950 text-violet-300' },
  dropped: { label: 'Abandonné', dot: 'bg-rose-400', bar: 'bg-rose-400', badge: 'bg-rose-950 text-rose-300' },
};

export const STATUS_ORDER = ['to_watch', 'watching', 'paused', 'completed', 'dropped'];
