import { Router } from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { MAX_PLAUSIBLE_RUNTIME } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

// Durée maximale retenue pour un film : au-delà, la donnée est considérée comme aberrante.
const MAX_MOVIE_RUNTIME = 360;

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Temps total passé sur les épisodes vus (en minutes). TMDB ne renseigne pas toujours la durée
    // par épisode : on utilise alors la durée moyenne de la série en repli. Chaque épisode est
    // plafonné, pour qu'une donnée aberrante ne fausse jamais le total.
    const [[episodeTime]] = await pool.query(
      `SELECT COALESCE(SUM(LEAST(COALESCE(e.runtime, s.episode_runtime, 0), ?)), 0) AS minutes, COUNT(*) AS count
      FROM watch_status w
      JOIN episodes e ON e.id = w.episode_id
      JOIN seasons se ON e.season_id = se.id
      JOIN shows s ON se.show_id = s.id
      WHERE w.watched = TRUE AND w.user_id = ?`,
      [MAX_PLAUSIBLE_RUNTIME, userId]
    );

    const [[movieTime]] = await pool.query(
      `SELECT COALESCE(SUM(LEAST(COALESCE(m.runtime, 0), ?)), 0) AS minutes, COUNT(*) AS count
      FROM movie_status ms
      JOIN movies m ON m.id = ms.movie_id
      WHERE ms.watched = TRUE AND ms.user_id = ?`,
      [MAX_MOVIE_RUNTIME, userId]
    );

    // Répartition par genre : séries suivies et films de la bibliothèque, comptés une fois chacun.
    const [genreRows] = await pool.query(
      `SELECT s.genres FROM shows s
        JOIN show_tracking st ON st.show_id = s.id
        WHERE st.user_id = ?
       UNION ALL
       SELECT m.genres FROM movies m
        JOIN movie_status ms ON ms.movie_id = m.id
        WHERE ms.user_id = ?`,
      [userId, userId]
    );

    const genreCounts = {};
    for (const row of genreRows) {
      if (!row.genres) continue;
      for (const g of row.genres.split(',').map((s) => s.trim()).filter(Boolean)) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
    const genres = Object.entries(genreCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Évolution mensuelle des visionnages (épisodes et films) en une seule requête.
    const [monthly] = await pool.query(
      `SELECT month, SUM(count) AS count FROM (
         SELECT DATE_FORMAT(watched_at, '%Y-%m') AS month, COUNT(*) AS count
           FROM watch_status
          WHERE user_id = ? AND watched = TRUE AND watched_at IS NOT NULL
          GROUP BY month
         UNION ALL
         SELECT DATE_FORMAT(watched_at, '%Y-%m') AS month, COUNT(*) AS count
           FROM movie_status
          WHERE user_id = ? AND watched = TRUE AND watched_at IS NOT NULL
          GROUP BY month
       ) AS x
       GROUP BY month
       ORDER BY month ASC`,
      [userId, userId]
    );

    res.json({
      totalMinutes: Number(episodeTime.minutes) + Number(movieTime.minutes),
      episodesWatched: Number(episodeTime.count),
      moviesWatched: Number(movieTime.count),
      genres,
      monthly: monthly.map((r) => ({ month: r.month, count: Number(r.count) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

export default router;
