import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';

export default function ShowCard({
  item,
  onAdd,
  addLabel,
  added,
  linkTo,
  onClick,
  footer,
  cornerBadge,
  friendsWatching,
}) {
  const poster = (
    <div className="aspect-[2/3] bg-zinc-800 shrink-0 relative">
      {item.poster_url ? (
        <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
          Pas d'affiche
        </div>
      )}
      {cornerBadge && (
        <div className="absolute top-1.5 right-1.5" onClick={(e) => e.preventDefault()}>
          {cornerBadge}
        </div>
      )}
      {friendsWatching && friendsWatching.length > 0 && (
        <div
          className="absolute bottom-1.5 left-1.5 flex -space-x-2"
          title={friendsWatching.map((f) => f.display_name || f.username).join(', ') + ' regarde(nt) aussi'}
        >
          {friendsWatching.slice(0, 4).map((f, i) => (
            <div key={i} className="ring-2 ring-zinc-900 rounded-full">
              <Avatar user={f} size="w-6 h-6" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const info = (
    <div className="p-3">
      <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{item.title}</h3>
      {(item.first_air_date || item.release_date) && (
        <p className="text-xs text-zinc-500 mt-1">
          {(item.first_air_date || item.release_date || '').slice(0, 4)}
        </p>
      )}
      {footer}
    </div>
  );

  // Tout est regroupé dans UN SEUL conteneur flex-col : évite qu'un enfant en h-full ne
  // pousse les boutons hors de la carte (bug de chevauchement en grille déjà rencontré).
  return (
    <div className="flex flex-col h-full">
      <div className="card flex flex-col flex-1">
        {linkTo ? (
          <Link to={linkTo} className="flex flex-col flex-1">
            {poster}
            {info}
          </Link>
        ) : onClick ? (
          <div onClick={onClick} className="flex flex-col flex-1 cursor-pointer">
            {poster}
            {info}
          </div>
        ) : (
          <>
            {poster}
            {info}
          </>
        )}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          disabled={added}
          className={`mt-1 text-xs rounded py-1 transition-colors ${
            added
              ? 'bg-emerald-950 text-emerald-300 cursor-default'
              : 'bg-accent hover:bg-accent-dark text-zinc-950'
          }`}
        >
          {added ? '✓ Suivi' : addLabel || '+ Suivre'}
        </button>
      )}
    </div>
  );
}
