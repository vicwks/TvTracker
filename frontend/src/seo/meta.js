import { fr } from '../i18n/fr.js';
import { en } from '../i18n/en.js';

// Adresse publique du site : canoniques, sitemap et données structurées. Fixée au build par VITE_SITE_URL.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'http://localhost:8080').replace(/\/$/, '');

const DICTIONARIES = { fr, en };
const LOCALES = { fr: 'fr_FR', en: 'en_GB' };

// Pages publiques : indexées, avec une URL canonique. Ce sont les seules pré-générées en HTML.
export const PUBLIC_PAGES = ['/', '/login', '/register', '/cgu', '/mentions-legales'];
const PUBLIC_KEYS = { '/': 'home', '/login': 'login', '/register': 'register', '/cgu': 'cgu', '/mentions-legales': 'mentions' };

// Pages de l'application : contenu personnel, donc jamais indexées. Leur titre reprend le libellé de la navigation.
const APP_LABEL_KEYS = {
  '/': 'nav.dashboard',
  '/discover': 'nav.discover',
  '/watchlist': 'nav.watchlist',
  '/calendar': 'nav.calendar',
  '/stats': 'nav.stats',
  '/friends': 'nav.friends',
  '/settings': 'nav.profile',
};

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

function normalisePath(pathname) {
  const path = pathname.replace(/\/+$/, '');
  return path === '' ? '/' : path;
}

// Données structurées de la page d'accueil : site, application et questions fréquentes.
function homeJsonLd(dict, lang) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: dict.seo.siteName,
      url: `${SITE_URL}/`,
      inLanguage: lang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.seo.siteName,
      url: `${SITE_URL}/`,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
      description: dict.seo.home.description,
      inLanguage: lang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: dict.landing.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}

// Ce qu'il faut afficher dans l'en-tête d'une page : titre, description, robots, canonique, partage, données structurées.
export function pageMeta(pathname, lang = 'fr') {
  const dict = DICTIONARIES[lang] ?? fr;
  const path = normalisePath(pathname);
  const siteName = dict.seo.siteName;

  if (PUBLIC_KEYS[path]) {
    const { title, description } = dict.seo[PUBLIC_KEYS[path]];
    return {
      title,
      description,
      robots: 'index, follow',
      canonical: `${SITE_URL}${path === '/' ? '/' : path}`,
      locale: LOCALES[lang] ?? LOCALES.fr,
      jsonLd: path === '/' ? homeJsonLd(dict, lang) : [],
    };
  }

  // Fiches série et film : titre générique, le contenu varie selon l'utilisateur.
  if (/^\/(show|movie)\/[^/]+$/.test(path)) {
    return { title: siteName, description: dict.seo.home.description, robots: 'noindex, nofollow', canonical: null, locale: LOCALES[lang] ?? LOCALES.fr, jsonLd: [] };
  }

  if (APP_LABEL_KEYS[path]) {
    const label = lookup(dict, APP_LABEL_KEYS[path]);
    return { title: `${label} · ${siteName}`, description: dict.seo.home.description, robots: 'noindex, nofollow', canonical: null, locale: LOCALES[lang] ?? LOCALES.fr, jsonLd: [] };
  }

  // Adresse inconnue : page introuvable, non indexée.
  return {
    title: dict.seo.notFound.title,
    description: dict.seo.notFound.description,
    robots: 'noindex, nofollow',
    canonical: null,
    locale: LOCALES[lang] ?? LOCALES.fr,
    jsonLd: [],
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Balises pour le HTML pré-généré (écrites dans <head> au build).
export function headMarkup(meta, lang = 'fr') {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${escapeHtml(meta.robots)}" />`,
    meta.canonical ? `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(fr.seo.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:locale" content="${escapeHtml(meta.locale)}" />`,
    meta.canonical ? `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />` : '',
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    ...meta.jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`),
  ];
  return tags.filter(Boolean).map((t) => `    ${t}`).join('\n');
}

function setMetaTag(attribute, name, content) {
  let el = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Met à jour l'en-tête du document dans le navigateur, à chaque changement de page.
export function applyHead(meta) {
  document.title = meta.title;
  setMetaTag('name', 'description', meta.description);
  setMetaTag('name', 'robots', meta.robots);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', fr.seo.siteName);
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:locale', meta.locale);
  setMetaTag('name', 'twitter:card', 'summary');
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (meta.canonical) {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', meta.canonical);
  } else if (canonical) {
    canonical.remove();
  }

  // Les données structurées ajoutées par le navigateur sont remplacées à chaque page.
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
  for (const data of meta.jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seoJsonld = 'true';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}
