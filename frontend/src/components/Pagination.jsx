import { useI18n } from '../i18n/LanguageContext.jsx';

// Neuf pages numérotées à la fois. Au début, ce sont les pages 1 à 9 ; ensuite la fenêtre glisse avec la page
// courante, pour que la page suivante soit toujours visible (page 9 : 2 à 10, page 10 : 3 à 11, etc.).
// La dernière page reste affichée, avec « … » entre les deux quand des pages sont masquées.
const NUMBERED = 9;

function range(from, to) {
  const pages = [];
  for (let p = from; p <= to; p += 1) pages.push(p);
  return pages;
}

function pageItems(page, pageCount) {
  const end = Math.min(pageCount, Math.max(NUMBERED, page + 1));
  const start = Math.max(1, end - NUMBERED + 1);
  const items = range(start, end).map((p) => ({ page: p }));
  if (end < pageCount - 1) items.push({ gap: true });
  if (end < pageCount) items.push({ page: pageCount });
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
