import { useEffect, useRef } from 'react';

// Fenêtre modale dans le style du site. Échap ou un clic sur le fond la ferme sans rien valider.
// `actions` : liste de { label, onClick, primary }. Le bouton principal reçoit le focus à l'ouverture.
export default function Dialog({ title, children, actions, onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 font-ui">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="animate-rise relative w-full max-w-md rounded-md border border-ink-line bg-ink-soft p-7 text-paper shadow-2xl shadow-black/60"
      >
        <h2 id="dialog-title" className="font-display text-2xl font-medium leading-tight">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-ink-muted">{children}</div>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          {actions.map((action) =>
            action.primary ? (
              <button
                key={action.label}
                type="button"
                autoFocus
                onClick={action.onClick}
                className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {action.label}
              </button>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="rounded-md border border-ink-line px-4 py-2 text-sm text-paper transition hover:border-signal hover:text-signal"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
