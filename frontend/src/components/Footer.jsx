import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';

const FOOTER_LINKS = [
  { to: '/', key: 'dashboard' },
  { to: '/discover', key: 'discover' },
  { to: '/search', key: 'search' },
  { to: '/shows', key: 'shows' },
  { to: '/movies', key: 'movies' },
  { to: '/watchlist', key: 'watchlist' },
  { to: '/calendar', key: 'calendar' },
  { to: '/stats', key: 'stats' },
  { to: '/friends', key: 'friends' },
];

const LEGAL_LINKS = [
  { to: '/cgu', key: 'footer.terms' },
  { to: '/mentions-legales', key: 'footer.legal' },
];

// Pied de page commun aux pages de l'application (pas sur les pages de connexion et d'inscription,
// qui tiennent dans l'écran sans défilement).
export default function Footer() {
  const { user } = useAuth();
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink-line bg-ink font-ui text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-xl font-medium">{t('common.brand')}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">{t('footer.tagline')}</p>
        </div>

        {user && (
          <nav aria-label={t('footer.navigationAria')}>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{t('footer.navigation')}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-paper/80 transition-colors hover:text-signal">
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{t('footer.information')}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {LEGAL_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-paper/80 transition-colors hover:text-signal">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-ink-muted sm:flex-row sm:justify-between sm:px-8">
          <p>{t('footer.copyright', { year })}</p>
          <p className="max-w-xl sm:text-right">
            {t('footer.tmdbBefore')}{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noreferrer"
              className="text-paper/80 underline-offset-4 hover:text-signal hover:underline"
            >
              {t('footer.tmdbLink')}
            </a>
            {t('footer.tmdbAfter')}
          </p>
        </div>
      </div>
    </footer>
  );
}
