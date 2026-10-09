import { Router } from 'express';
import { searchShows, searchMovies, IMAGE_BASE_URL } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cached } from '../services/cache.js';
import { getTrackedMap } from '../services/tracking.js';

const router = Router();
router.use(requireAuth);

const SEARCH_TTL = 10 * 60 * 1000;
const MAX_QUERY_LENGTH = 100;

// Renvoie la requête nettoyée, ou null si elle est absente, vide ou trop longue.
function readQuery(value) {
  if (typeof value !== 'string') return null;
  const q = value.trim();
  if (!q || q.length > MAX_QUERY_LENGTH) return null;
  return q;
}

// Ajoute à chaque résultat son identifiant local s'il est déjà suivi (null sinon).
async function withTracked(userId, items, type) {
  const tracked = await getTrackedMap(userId, items.map((i) => i.tmdb_id), type);
  return items.map((i) => ({ ...i, tracked_id: tracked[i.tmdb_id] ?? null }));
}

router.get('/shows', async (req, res) => {
  try {
    const q = readQuery(req.query.q);
    if (!q) return res.json([]);

    const results = await cached(`search:shows:${q.toLowerCase()}`, SEARCH_TTL, () => searchShows(q));
    const items = results.map((r) => ({
      tmdb_id: r.id,
      title: r.name,
      overview: r.overview,
      poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
      first_air_date: r.first_air_date,
    }));
    res.json(await withTracked(req.userId, items, 'show'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la recherche de séries' });
  }
});

router.get('/movies', async (req, res) => {
  try {
    const q = readQuery(req.query.q);
    if (!q) return res.json([]);

    const results = await cached(`search:movies:${q.toLowerCase()}`, SEARCH_TTL, () => searchMovies(q));
    const items = results.map((r) => ({
      tmdb_id: r.id,
      title: r.title,
      overview: r.overview,
      poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
      release_date: r.release_date,
    }));
    res.json(await withTracked(req.userId, items, 'movie'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la recherche de films' });
  }
});

export default router;
