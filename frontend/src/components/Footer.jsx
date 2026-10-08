import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FOOTER_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/discover', label: 'Découvrir' },
  { to: '/search', label: 'Rechercher' },
  { to: '/shows', label: 'Mes séries' },
  { to: '/movies', label: 'Mes films' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/calendar', label: 'Calendrier' },
  { to: '/stats', label: 'Stats' },
  { to: '/friends', label: 'Amis' },
];

const LEGAL_LINKS = [
  { to: '/cgu', label: "Conditions générales d'utilisation" },
  { to: '/mentions-legales', label: 'Mentions légales' },
];

// Pied de page commun aux pages de l'application (pas sur les pages de connexion et d'inscription,
// qui tiennent dans l'écran sans défilement).
export default function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink-line bg-ink font-ui text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-xl font-medium">TV Tracker</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            Suis tes séries et tes films, retrouve où tu en es, ne rate aucun épisode.
          </p>
        </div>

        {user && (
          <nav aria-label="Navigation du pied de page">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Navigation</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-paper/80 transition-colors hover:text-signal">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Informations</p>
          <ul className="mt-4 space-y-2 text-sm">
            {LEGAL_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-paper/80 transition-colors hover:text-signal">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-ink-muted sm:flex-row sm:justify-between sm:px-8">
          <p>© {year} TV Tracker</p>
          <p className="max-w-xl sm:text-right">
            Les données de séries et de films proviennent de{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noreferrer"
              className="text-paper/80 underline-offset-4 hover:text-signal hover:underline"
            >
              TMDB
            </a>
            . Ce produit n'est pas approuvé ni certifié par TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
