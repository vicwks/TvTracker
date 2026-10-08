// Pagination numérotée, dans le style du site d'accès (ambre pour la page active).
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 font-ui text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="rounded-md border border-ink-line px-3 py-1.5 text-ink-muted transition hover:border-signal hover:text-signal disabled:opacity-40 disabled:hover:border-ink-line disabled:hover:text-ink-muted"
      >
        ← Précédent
      </button>

      <ul className="flex flex-wrap gap-1">
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={`min-w-9 rounded-md px-3 py-1.5 tabular-nums transition ${
                p === page ? 'bg-signal font-medium text-signal-ink' : 'text-ink-muted hover:text-paper'
              }`}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className="rounded-md border border-ink-line px-3 py-1.5 text-ink-muted transition hover:border-signal hover:text-signal disabled:opacity-40 disabled:hover:border-ink-line disabled:hover:text-ink-muted"
      >
        Suivant →
      </button>
    </nav>
  );
}
