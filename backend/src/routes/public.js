import { Router } from 'express';
import { cached } from '../services/cache.js';
import { getTrendingShows, getTrendingMovies, IMAGE_BASE_URL } from '../services/tmdb.js';

const router = Router();

const HOUR = 60 * 60 * 1000;
// Affiches décoratives de la page de connexion : elles changent peu, six heures suffisent.
const POSTERS_TTL = 6 * HOUR;
const POSTER_COUNT = 10;

// Alterne films et séries pour que la sélection mêle les deux types.
function mixPosters(shows, movies) {
  const showItems = shows
    .filter((s) => s.poster_path)
    .map((s) => ({ tmdb_id: s.id, type: 'show', title: s.name, poster_url: `${IMAGE_BASE_URL}${s.poster_path}` }));
  const movieItems = movies
    .filter((m) => m.poster_path && !m.adult)
    .map((m) => ({ tmdb_id: m.id, type: 'movie', title: m.title, poster_url: `${IMAGE_BASE_URL}${m.poster_path}` }));

  const mixed = [];
  const longest = Math.max(showItems.length, movieItems.length);
  for (let i = 0; i < longest; i++) {
    if (movieItems[i]) mixed.push(movieItems[i]);
    if (showItems[i]) mixed.push(showItems[i]);
  }
  return mixed.slice(0, POSTER_COUNT);
}

// Route publique (pas de requireAuth) : seulement des titres et des affiches TMDB, rien de personnel.
router.get('/posters', async (req, res) => {
  try {
    const posters = await cached('public:posters', POSTERS_TTL, async () => {
      const [shows, movies] = await Promise.all([getTrendingShows(), getTrendingMovies()]);
      return mixPosters(shows, movies);
    });
    res.json(posters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des affiches' });
  }
});

export default router;
