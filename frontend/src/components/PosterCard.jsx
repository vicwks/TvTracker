import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext.jsx';
import Avatar from './Avatar.jsx';

// Carte d'affiche dans le style du site : même traitement que les vignettes du tableau de bord.
// Le clic ouvre la fiche : `to` pour un lien, `onOpen` pour une action. `footer` reçoit un bouton d'action
// placé sous le titre, en dehors du lien. `cornerBadge` se pose dans le coin haut droit, hors du lien.
export default function PosterCard({
  title,
  year,
  posterUrl,
  to,
  onOpen,
  footer,
  cornerBadge,
  friends = [],
  delay = 0,
}) {
  const { t } = useI18n();

  const poster = (
    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-ink-soft ring-1 ring-ink-line transition duration-500 group-hover:-translate-y-1 group-hover:ring-signal/60 group-hover:shadow-[0_18px_40px_-18px_rgba(245,165,36,0.55)]">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-ink-muted">
          {t('card.noPoster')}
        </div>
      )}
      {friends.length > 0 && (
        <div
          className="absolute bottom-2 left-2 flex -space-x-2"
          title={t('card.friendsWatching', { names: friends.map((f) => f.display_name || f.username).join(', ') })}
        >
          {friends.slice(0, 4).map((friend) => (
            <div key={friend.id ?? friend.username} className="rounded-full ring-2 ring-ink">
              <Avatar user={friend} size="w-6 h-6" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const info = (
    <>
      {/* Hauteurs fixes (deux lignes de titre, une ligne de méta) : les cartes d'une même rangée restent alignées. */}
      <h3 className="mt-3 line-clamp-2 min-h-[3.25rem] font-display text-lg leading-snug text-paper">{title}</h3>
      <p className="mt-1 min-h-[1rem] text-xs tabular-nums text-ink-muted">{year || ' '}</p>
    </>
  );

  return (
    <article className="group relative flex h-full animate-rise flex-col" style={{ animationDelay: `${delay}ms` }}>
      {to && (
        <Link to={to} className="block">
          {poster}
          {info}
        </Link>
      )}
      {!to && onOpen && (
        <button type="button" onClick={onOpen} className="block w-full text-left">
          {poster}
          {info}
        </button>
      )}
      {!to && !onOpen && (
        <div>
          {poster}
          {info}
        </div>
      )}
      {footer && <div className="mt-auto flex min-h-[2.75rem] flex-col justify-end pt-2">{footer}</div>}
      {cornerBadge && <div className="absolute right-3 top-3">{cornerBadge}</div>}
    </article>
  );
}
