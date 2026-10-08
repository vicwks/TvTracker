import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-accent text-zinc-950' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <span className="text-lg font-bold text-zinc-100 tracking-tight">
          📺 <span className="text-accent">TV</span> Tracker
        </span>

        {user && (
          <div className="flex gap-1 flex-wrap">
            <NavLink to="/" className={linkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/discover" className={linkClass}>
              Découvrir
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              Rechercher
            </NavLink>
            <NavLink to="/shows" className={linkClass}>
              Mes séries
            </NavLink>
            <NavLink to="/movies" className={linkClass}>
              Mes films
            </NavLink>
            <NavLink to="/watchlist" className={linkClass}>
              Watchlist
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              Calendrier
            </NavLink>
            <NavLink to="/stats" className={linkClass}>
              Stats
            </NavLink>
            <NavLink to="/friends" className={linkClass}>
              Amis
            </NavLink>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <Avatar user={user} size="w-7 h-7" />
            <span className="text-sm text-zinc-300 hidden sm:inline">{user.display_name}</span>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
