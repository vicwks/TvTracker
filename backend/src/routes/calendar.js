import { Router } from 'express';
import pool from '../db/connection.js';
import { IMAGE_BASE_URL } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Épisodes de MES séries activement suivies (statut "watching" ou "to_watch"), triés par date de diffusion.
//   ?days=N : les épisodes à venir, à partir d'aujourd'hui, sur N jours (60 par défaut).
//   ?past=N : les épisodes diffusés avant aujourd'hui, sur les N derniers jours, du plus récent au plus ancien.
// N est compris entre 1 et 365.
function parseDays(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 365) : fallback;
}

router.get('/', async (req, res) => {
  try {
    const isPast = req.query.past !== undefined;
    const days = isPast ? parseDays(req.query.past, 60) : parseDays(req.query.days, 60);
    // Fragments SQL constants : la seule valeur saisie par l'utilisateur est le nombre de jours, passé en paramètre.
    const dateCondition = isPast
      ? 'e.air_date BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
      : 'e.air_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)';
    const order = isPast ? 'DESC' : 'ASC';

    const [rows] = await pool.query(
      `
      SELECT e.id AS episode_id, e.title AS episode_title, e.episode_number, e.air_date,
             se.season_number, s.id AS show_id, s.title AS show_title, s.poster_path
      FROM show_tracking st
      JOIN shows s ON s.id = st.show_id
      JOIN seasons se ON se.show_id = s.id
      JOIN episodes e ON e.season_id = se.id
      WHERE st.user_id = ? AND st.status IN ('watching', 'to_watch')
        AND ${dateCondition}
      ORDER BY e.air_date ${order}, s.title ASC
      `,
      [req.userId, days]
    );
    res.json(
      rows.map((r) => ({
        ...r,
        poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération du calendrier' });
  }
});

export default router;
