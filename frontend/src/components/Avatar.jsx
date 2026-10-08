export default function Avatar({ user, size = 'w-10 h-10' }) {
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
      className={`${size} rounded-full bg-accent/20 text-accent flex items-center justify-center font-semibold text-xs`}
    >
      {initial}
    </div>
  );
}
