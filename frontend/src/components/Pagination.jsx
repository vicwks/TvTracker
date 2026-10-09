import { useI18n } from '../i18n/LanguageContext.jsx';

// Pages affichées : la première et la dernière, la page courante et ses deux voisines. Les pages sautées
// deviennent « … ». Sept éléments au plus, quel que soit le nombre de pages.
function pageItems(page, pageCount) {
  const wanted = [...new Set([1, pageCount, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);

  const items = [];
  wanted.forEach((p, i) => {
    if (i > 0 && p - wanted[i - 1] > 1) items.push({ gap: true, key: `gap-${p}` });
    items.push({ page: p, key: `page-${p}` });
  });
  return items;
}

// Pagination compacte, dans le style du site (ambre pour la page active).
export default function Pagination({ page, pageCount, onChange }) {
  const { t } = useI18n();

  if (pageCount <= 1) return null;

  const arrowClass =
    'flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition hover:text-signal disabled:opacity-30 disabled:hover:text-ink-muted';

  return (
    <nav aria-label={t('pagination.label')} className="mt-10 flex items-center justify-center gap-1 font-ui text-sm">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className={arrowClass}>
        <span className="sr-only">{t('pagination.previous')}</span>
        <span aria-hidden="true">←</span>
      </button>

      <ul className="flex items-center gap-1">
        {pageItems(page, pageCount).map((item) =>
          item.gap ? (
            <li key={item.key} aria-hidden="true" className="w-6 text-center text-ink-muted">
              …
            </li>
          ) : (
            <li key={item.key}>
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
