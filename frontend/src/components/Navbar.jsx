import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';
import Avatar from './Avatar.jsx';
import LanguageSwitch from './LanguageSwitch.jsx';

// Liens de navigation : soulignement ambre qui se dessine au survol et pour la page active.
const linkClass = ({ isActive }) =>
  `relative whitespace-nowrap py-1 text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-signal after:transition-transform after:duration-300 after:content-[''] hover:text-paper hover:after:scale-x-100 ${
    isActive ? 'text-paper after:scale-x-100' : 'text-ink-muted after:scale-x-0'
  }`;

const NAV_ITEMS = [
  { to: '/', key: 'dashboard', end: true },
  { to: '/discover', key: 'discover' },
  { to: '/search', key: 'search' },
  { to: '/watchlist', key: 'watchlist' },
  { to: '/calendar', key: 'calendar' },
  { to: '/stats', key: 'stats' },
  { to: '/friends', key: 'friends' },
];

// Barre de navigation de l'application : même identité que les pages d'accès et le tableau de bord.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-ink-line bg-ink/85 font-ui text-paper backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4 sm:px-8">
        <Link
          to={user ? '/' : '/login'}
          className="shrink-0 font-display text-lg font-medium tracking-tight text-paper"
        >
          {t('common.brand')}
        </Link>

        {user && (
          <div aria-label={t('nav.main')} className="flex flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitch />
          {user && (
            <>
              <Link
                to="/settings"
                title={t('nav.profile')}
                aria-label={t('nav.profile')}
                className="group flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-ink-soft"
              >
                <Avatar user={user} size="w-7 h-7" />
                <span className="hidden text-sm text-ink-muted transition-colors group-hover:text-paper sm:inline">
                  {user.display_name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-ink-line px-3 py-1.5 text-xs text-paper transition hover:border-signal hover:text-signal"
              >
                {t('nav.logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
