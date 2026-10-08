import { Router } from 'express';
import pool from '../db/connection.js';
import { IMAGE_BASE_URL } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Liste les épisodes à venir (ou diffusés récemment) pour MES séries activement suivies
// (statut "watching" ou "to_watch"), triés par date de diffusion.
// ?days=N : fenêtre vers le futur, entre 1 et 365 jours (60 par défaut).
router.get('/', async (req, res) => {
  try {
    const parsed = parseInt(req.query.days, 10);
    const days = Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 365) : 60;

    const [rows] = await pool.query(
      `
      SELECT e.id AS episode_id, e.title AS episode_title, e.episode_number, e.air_date,
             se.season_number, s.id AS show_id, s.title AS show_title, s.poster_path
      FROM show_tracking st
      JOIN shows s ON s.id = st.show_id
      JOIN seasons se ON se.show_id = s.id
      JOIN episodes e ON e.season_id = se.id
      WHERE st.user_id = ? AND st.status IN ('watching', 'to_watch')
        AND e.air_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY e.air_date ASC
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
