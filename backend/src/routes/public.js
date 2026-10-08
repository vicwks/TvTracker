import { Router } from 'express';
import { cached } from '../services/cache.js';
import { getTrendingAll, IMAGE_BASE_URL_LARGE } from '../services/tmdb.js';

const router = Router();

const HOUR = 60 * 60 * 1000;
// Le top du moment bouge dans la journée : trois heures gardent les données fraîches sans gaspiller le quota TMDB.
const POSTERS_TTL = 3 * HOUR;
const POSTER_COUNT = 10;

// Top 10 du moment, séries et films mêlés, dans l'ordre de popularité donné par TMDB.
// Les personnes (media_type "person") et les éléments sans affiche sont écartés.
function toTopPosters(results) {
  return results
    .filter((r) => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path && !r.adult)
    .slice(0, POSTER_COUNT)
    .map((r) => {
      const isShow = r.media_type === 'tv';
      return {
        tmdb_id: r.id,
        type: isShow ? 'show' : 'movie',
        title: isShow ? r.name : r.title,
        poster_url: `${IMAGE_BASE_URL_LARGE}${r.poster_path}`,
      };
    });
}

// Route publique (pas de requireAuth) : seulement des titres et des affiches TMDB, rien de personnel.
router.get('/posters', async (req, res) => {
  try {
    const posters = await cached('public:posters', POSTERS_TTL, async () =>
      toTopPosters(await getTrendingAll('day'))
    );
    res.json(posters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des affiches' });
  }
});

export default router;
