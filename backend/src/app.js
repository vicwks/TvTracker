import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import pool from './db/connection.js';
import authRoutes from './routes/auth.js';
import friendsRoutes from './routes/friends.js';
import discoverRoutes from './routes/discover.js';
import publicRoutes from './routes/public.js';
import searchRoutes from './routes/search.js';
import showsRoutes from './routes/shows.js';
import episodesRoutes from './routes/episodes.js';
import moviesRoutes from './routes/movies.js';
import watchlistRoutes from './routes/watchlist.js';
import statsRoutes from './routes/stats.js';
import calendarRoutes from './routes/calendar.js';
import importRoutes from './routes/import.js';
import { startEpisodeCheckCron } from './cron/checkNewEpisodes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Une erreur inattendue dans une promesse est journalisée, le serveur continue.
process.on('unhandledRejection', (err) => {
  console.error('Promesse non gérée :', err);
});
// Une exception non interceptée laisse le processus dans un état inconnu : on journalise puis on
// quitte. Docker redémarre le conteneur (restart: unless-stopped).
process.on('uncaughtException', (err) => {
  console.error('Exception non interceptée :', err);
  process.exit(1);
});

// Le backend est derrière Nginx (Docker) : on fait confiance à un saut de proxy pour l'IP du client.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// credentials:true + origin explicite (obligatoire, "*" ne fonctionne pas avec les cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/episodes', episodesRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/import', importRoutes);

// Santé : 200 si la base répond, 503 sinon (utilisé par le healthcheck Docker).
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
  if (!process.env.TMDB_API_KEY) {
    console.warn('⚠️  TMDB_API_KEY manquante dans le fichier .env — la recherche ne fonctionnera pas.');
  }
  startEpisodeCheckCron();
});

// Arrêt propre : Docker envoie SIGTERM avant de couper le conteneur.
function shutdown(signal) {
  console.log(`${signal} reçu, arrêt du serveur...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  // Au cas où une connexion reste ouverte : on force l'arrêt après 10 secondes.
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
