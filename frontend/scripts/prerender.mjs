// Étape finale du build : écrit une page HTML par page publique (contenu rendu + balises d'en-tête),
// puis robots.txt, sitemap.xml et llms.txt. Lancé après « vite build » et « vite build --ssr ».
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrBundle = join(root, '.prerender', 'prerender.js');
const siteUrl = (process.env.VITE_SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const { renderPage, PUBLIC_PAGES } = await import(pathToFileURL(ssrBundle).href);

// Le modèle est lu une seule fois, avant d'écrire la page d'accueil qui en prend la place.
const template = readFileSync(join(dist, 'index.html'), 'utf8');

// La feuille de style est copiée dans chaque page pré-générée : le premier affichage n'attend pas une requête de plus.
const stylesheet = template.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
const inlineCss = stylesheet ? `<style>${readFileSync(join(dist, stylesheet[1]), 'utf8')}</style>` : '';

// Les pages sont écrites en fichiers « page.html » à la racine : nginx les sert directement, sans redirection
// vers « page/ ». Le carrousel d'affiches n'existe que sur la connexion et l'inscription : seules elles
// préchargent la liste des affiches.
const POSTERS_PRELOAD = '<link rel="preload" href="/api/public/posters" as="fetch" crossorigin />';
for (const path of PUBLIC_PAGES) {
  const { html, head } = renderPage(path);
  const preload = path === '/login' || path === '/register' ? `\n    ${POSTERS_PRELOAD}` : '';
  const page = template
    .replace(/<title>[^<]*<\/title>\s*/, '')
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    .replace(/<link rel="stylesheet"[^>]*>/, inlineCss)
    .replace('</head>', `${head}${preload}\n  </head>`);
  const file = path === '/' ? join(dist, 'index.html') : join(dist, `${path.slice(1)}.html`);
  writeFileSync(file, page);
  console.log('pré-généré', path);
}

// Robots : tout le site public est autorisé, y compris pour les robots d'IA ; l'API et le sitemap sont annoncés.
const aiBots = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];
writeFileSync(
  join(dist, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', 'Disallow: /api/', '']),
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
);

// Plan du site : uniquement les pages publiques (les pages privées ne doivent pas être indexées).
writeFileSync(
  join(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PUBLIC_PAGES.map((path) => `  <url><loc>${siteUrl}${path === '/' ? '/' : path}</loc><lastmod>${today}</lastmod></url>`),
    '</urlset>',
    '',
  ].join('\n')
);

// llms.txt : présentation du site pour les assistants d'IA (format proposé sur llmstxt.org).
writeFileSync(
  join(dist, 'llms.txt'),
  [
    '# TV Tracker',
    '',
    '> TV Tracker est une application web pour suivre ses séries et ses films, épisode par épisode : progression, watchlist, calendrier des sorties, notes et statistiques de visionnage.',
    '',
    'Les pages publiques sont listées ci-dessous. Le reste de l’application (watchlist, calendrier, statistiques) demande une connexion.',
    '',
    '## Pages publiques',
    '',
    `- [Accueil](${siteUrl}/): présentation de TV Tracker et questions fréquentes`,
    `- [Connexion](${siteUrl}/login): accès au compte`,
    `- [Créer un compte](${siteUrl}/register): inscription`,
    `- [Conditions générales d’utilisation](${siteUrl}/cgu)`,
    `- [Mentions légales](${siteUrl}/mentions-legales)`,
    '',
    '## Sources des données',
    '',
    'Les titres, affiches, saisons et épisodes proviennent de The Movie Database (TMDB). TV Tracker n’est pas approuvé ni certifié par TMDB.',
    '',
  ].join('\n')
);

rmSync(join(root, '.prerender'), { recursive: true, force: true });
console.log('robots.txt, sitemap.xml et llms.txt écrits pour', siteUrl);
