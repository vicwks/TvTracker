import { Router } from 'express';
import { importShowForUser } from '../services/importShow.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

const MAX_SHOWS_PER_IMPORT = 1000;

/**
 * Import "best effort" de données exportées (format libre en JSON) :
 * Body attendu : { shows: [{ title, year?, watched_episodes: [{season, episode}] }] }
 *
 * Chaque série est recherchée sur TMDB, ajoutée au suivi, puis ses épisodes indiqués sont marqués vus.
 * Un rapport est renvoyé pour vérifier les correspondances ambiguës.
 */
router.post('/', async (req, res) => {
  try {
    const { shows } = req.body;
    if (!Array.isArray(shows)) return res.status(400).json({ error: 'Le champ "shows" doit être une liste' });
    if (shows.length > MAX_SHOWS_PER_IMPORT) {
      return res.status(400).json({ error: `Import limité à ${MAX_SHOWS_PER_IMPORT} séries à la fois` });
    }

    const report = [];
    for (const item of shows) {
      report.push(await importShowForUser(req.userId, item, { defaultStatus: 'watching' }));
    }
    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'import" });
  }
});

export default router;
