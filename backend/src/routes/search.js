import { Router } from 'express';
import { searchShows, searchMovies, IMAGE_BASE_URL } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cached } from '../services/cache.js';

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

router.get('/shows', async (req, res) => {
  try {
    const q = readQuery(req.query.q);
    if (!q) return res.json([]);

    const results = await cached(`search:shows:${q.toLowerCase()}`, SEARCH_TTL, () => searchShows(q));
    res.json(
      results.map((r) => ({
        tmdb_id: r.id,
        title: r.name,
        overview: r.overview,
        poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
        first_air_date: r.first_air_date,
      }))
    );
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
    res.json(
      results.map((r) => ({
        tmdb_id: r.id,
        title: r.title,
        overview: r.overview,
        poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
        release_date: r.release_date,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la recherche de films' });
  }
});

export default router;
