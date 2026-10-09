import { useI18n } from '../i18n/LanguageContext.jsx';

// Jusqu'à neuf pages : toutes sont numérotées. Au-delà, les neuf premières pages sont numérotées tant qu'on
// est sur l'une d'elles ; à partir de la dixième, la page courante et ses deux voisines s'affichent, entre
// la première et la dernière page, avec « … » pour les pages masquées.
const NUMBERED = 9;

function range(from, to) {
  const pages = [];
  for (let p = from; p <= to; p += 1) pages.push(p);
  return pages;
}

function pageItems(page, pageCount) {
  if (pageCount <= NUMBERED + 1) {
    return range(1, pageCount).map((p) => ({ page: p }));
  }

  if (page <= NUMBERED) {
    return [...range(1, NUMBERED).map((p) => ({ page: p })), { gap: true }, { page: pageCount }];
  }

  const from = Math.max(2, page - 2);
  const to = Math.min(pageCount - 1, page + 2);
  const items = [{ page: 1 }];
  if (from > 2) items.push({ gap: true });
  items.push(...range(from, to).map((p) => ({ page: p })));
  if (to < pageCount - 1) items.push({ gap: true });
  items.push({ page: pageCount });
  return items;
}

// Pagination compacte, dans le style du site (ambre pour la page active). Les flèches restent disponibles
// pour aller au-delà des pages affichées.
export default function Pagination({ page, pageCount, onChange }) {
  const { t } = useI18n();

  if (pageCount <= 1) return null;

  const arrowClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:text-signal disabled:opacity-30 disabled:hover:text-ink-muted';

  return (
    <nav aria-label={t('pagination.label')} className="mt-10 flex items-center justify-center gap-1 font-ui text-sm">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className={arrowClass}>
        <span className="sr-only">{t('pagination.previous')}</span>
        <span aria-hidden="true">←</span>
      </button>

      <ul className="flex flex-wrap items-center justify-center gap-1">
        {pageItems(page, pageCount).map((item, i) =>
          item.gap ? (
            <li key={`gap-${i}`} aria-hidden="true" className="w-6 text-center text-ink-muted">
              …
            </li>
          ) : (
            <li key={`page-${item.page}`}>
              <button
                type="button"
                onClick={() => onChange(item.page)}
                aria-current={item.page === page ? 'page' : undefined}
                aria-label={t('pagination.page', { page: item.page })}
                className={`flex h-9 min-w-9 items-center justify-center rounded-md px-2 tabular-nums transition ${
                  item.page === page ? 'bg-signal font-medium text-signal-ink' : 'text-ink-muted hover:text-paper'
                }`}
              >
                {item.page}
              </button>
            </li>
          )
        )}
      </ul>

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === pageCount} className={arrowClass}>
        <span className="sr-only">{t('pagination.next')}</span>
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
