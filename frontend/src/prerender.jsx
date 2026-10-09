// Point d'entrée du pré-rendu (build SSR, voir scripts/prerender.mjs). Il rend en HTML les pages publiques,
// pour que les robots qui n'exécutent pas JavaScript voient leur contenu. Le navigateur reprend ensuite ce rendu.
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { PUBLIC_PAGES, headMarkup, pageMeta } from './seo/meta.js';

// Les pages pré-générées sont en français (langue par défaut) ; un visiteur anglophone voit l'anglais après chargement.
export function renderPage(path) {
  const html = renderToString(
    <LanguageProvider>
      <StaticRouter location={path}>
        <App />
      </StaticRouter>
    </LanguageProvider>
  );
  return { html, head: headMarkup(pageMeta(path, 'fr'), 'fr') };
}

export { PUBLIC_PAGES };
