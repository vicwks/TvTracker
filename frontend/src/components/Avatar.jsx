// Photo de profil, ou à défaut l'initiale du nom sur fond ambre (couleur de l'identité).
export default function Avatar({ user, size = 'w-10 h-10', initialClass = 'text-xs' }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.display_name || user.username}
        className={`${size} rounded-full object-cover`}
      />
    );
  }
  const initial = (user.display_name || user.username || '?')[0].toUpperCase();
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-signal/15 font-semibold text-signal ${initialClass}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
