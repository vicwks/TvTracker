import { Router } from 'express';
import pool from '../db/connection.js';
import { syncShowFromTmdb } from '../services/showSync.js';
import { refreshShowCompletion } from '../services/showStatus.js';
import { getShowDetails, IMAGE_BASE_URL, isNotFoundError } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  SHOW_STATUSES,
  toPositiveInt,
  toRating,
} from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

// Synchronise une série demandée par son id TMDB. Retourne l'id local, ou null si TMDB ne la connaît pas.
async function syncOrNull(tmdbId, options) {
  try {
    return await syncShowFromTmdb(tmdbId, options);
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

// Recalcule le statut ("terminé" vs "en cours") de toutes MES séries suivies, en une passe.
router.post('/recompute-status', async (req, res) => {
  try {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM show_tracking WHERE user_id = ?', [
      req.userId,
    ]);
    await refreshShowCompletion(req.userId);
    res.json({ ok: true, checked: Number(count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du recalcul des statuts' });
  }
});

// Résout un tmdb_id vers l'id local (synchronise la série en cache si besoin),
// SANS créer de suivi pour l'utilisateur. Utilisé pour prévisualiser une fiche série.
router.get('/resolve/:tmdbId', async (req, res) => {
  try {
    const tmdbId = toPositiveInt(req.params.tmdbId);
    if (!tmdbId) return res.status(400).json({ error: 'Identifiant TMDB invalide' });

    const showId = await syncOrNull(tmdbId);
    if (!showId) return res.status(404).json({ error: 'Série introuvable sur TMDB' });
    res.json({ id: showId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la série' });
  }
});

// Ajoute une série à MON suivi (la série elle-même est mise en cache globalement)
router.post('/', async (req, res) => {
  try {
    const tmdbId = toPositiveInt(req.body.tmdb_id);
    if (!tmdbId) return res.status(400).json({ error: 'tmdb_id requis' });
    const status = req.body.status || 'to_watch';
    if (!SHOW_STATUSES.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    const showId = await syncOrNull(tmdbId);
    if (!showId) return res.status(404).json({ error: 'Série introuvable sur TMDB' });

    await pool.query(
      `INSERT INTO show_tracking (user_id, show_id, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [req.userId, showId, status]
    );

    res.status(201).json({ id: showId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout de la série" });
  }
});

// Liste MES séries suivies avec statut et progression (agrégats calculés une seule fois)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT s.id, s.title, s.poster_path, s.first_air_date, s.tmdb_status, s.genres,
             st.status,
             COALESCE(tot.total, 0) AS total_episodes,
             COALESCE(seen.watched, 0) AS watched_episodes
      FROM shows s
      JOIN show_tracking st ON st.show_id = s.id AND st.user_id = ?
      LEFT JOIN (
        SELECT se.show_id, COUNT(*) AS total
        FROM episodes e
        JOIN seasons se ON e.season_id = se.id
        WHERE se.show_id IN (SELECT show_id FROM show_tracking WHERE user_id = ?)
        GROUP BY se.show_id
      ) tot ON tot.show_id = s.id
      LEFT JOIN (
        SELECT se.show_id, COUNT(*) AS watched
        FROM watch_status w
        JOIN episodes e ON e.id = w.episode_id
        JOIN seasons se ON e.season_id = se.id
        WHERE w.user_id = ? AND w.watched = TRUE
        GROUP BY se.show_id
      ) seen ON seen.show_id = s.id
      ORDER BY s.title ASC
    `,
      [req.userId, req.userId, req.userId]
    );
    res.json(
      rows.map((r) => ({
        ...r,
        poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des séries' });
  }
});

// Détail d'une série avec saisons, épisodes et MON statut de visionnage (watch_count inclus)
router.get('/:id', async (req, res) => {
  try {
    const showId = toPositiveInt(req.params.id);
    if (!showId) return res.status(404).json({ error: 'Série introuvable' });

    const [[show]] = await pool.query(
      `SELECT s.*, st.status AS tracking_status
       FROM shows s LEFT JOIN show_tracking st ON st.show_id = s.id AND st.user_id = ?
       WHERE s.id = ?`,
      [req.userId, showId]
    );
    if (!show) return res.status(404).json({ error: 'Série introuvable' });

    const [seasons] = await pool.query('SELECT * FROM seasons WHERE show_id = ? ORDER BY season_number ASC', [
      showId,
    ]);

    // Tous les épisodes de la série en une seule requête, rangés ensuite par saison.
    const [episodes] = await pool.query(
      `SELECT e.*, w.watched, w.watched_at, w.watch_count, r.rating
       FROM episodes e
       JOIN seasons se ON e.season_id = se.id
       LEFT JOIN watch_status w ON w.episode_id = e.id AND w.user_id = ?
       LEFT JOIN ratings r ON r.target_type = 'episode' AND r.target_id = e.id AND r.user_id = ?
       WHERE se.show_id = ?
       ORDER BY se.season_number ASC, e.episode_number ASC`,
      [req.userId, req.userId, showId]
    );

    const episodesBySeason = new Map();
    for (const e of episodes) {
      if (!episodesBySeason.has(e.season_id)) episodesBySeason.set(e.season_id, []);
      episodesBySeason.get(e.season_id).push({
        ...e,
        watched: !!e.watched,
        watch_count: e.watch_count || 0,
        still_url: e.still_path ? `${IMAGE_BASE_URL}${e.still_path}` : null,
      });
    }
    for (const season of seasons) {
      season.episodes = episodesBySeason.get(season.id) || [];
    }

    const [[ratingRow]] = await pool.query(
      "SELECT rating FROM ratings WHERE target_type='show' AND target_id = ? AND user_id = ?",
      [showId, req.userId]
    );

    res.json({
      ...show,
      poster_url: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
      backdrop_url: show.backdrop_path ? `${IMAGE_BASE_URL}${show.backdrop_path}` : null,
      rating: ratingRow ? ratingRow.rating : null,
      seasons,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la série' });
  }
});

// Change MON statut de suivi (to_watch / watching / paused / completed / dropped)
router.patch('/:id/status', async (req, res) => {
  try {
    const showId = toPositiveInt(req.params.id);
    const { status } = req.body;
    if (!showId) return res.status(404).json({ error: 'Série introuvable' });
    if (!SHOW_STATUSES.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

    const [[show]] = await pool.query('SELECT id FROM shows WHERE id = ?', [showId]);
    if (!show) return res.status(404).json({ error: 'Série introuvable' });

    await pool.query(
      `INSERT INTO show_tracking (user_id, show_id, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [req.userId, showId, status]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// Ma note globale sur la série (0 à 10)
router.post('/:id/rating', async (req, res) => {
  try {
    const showId = toPositiveInt(req.params.id);
    const rating = toRating(req.body.rating);
    if (!showId) return res.status(404).json({ error: 'Série introuvable' });
    if (rating === null) return res.status(400).json({ error: 'Note invalide (entre 0 et 10)' });

    const [[show]] = await pool.query('SELECT id FROM shows WHERE id = ?', [showId]);
    if (!show) return res.status(404).json({ error: 'Série introuvable' });

    await pool.query(
      `INSERT INTO ratings (user_id, target_type, target_id, rating) VALUES (?, 'show', ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.userId, showId, rating]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la note" });
  }
});

// Retire la série de MON suivi uniquement (la série reste en cache pour les autres utilisateurs)
router.delete('/:id', async (req, res) => {
  try {
    const showId = toPositiveInt(req.params.id);
    if (!showId) return res.status(404).json({ error: 'Série introuvable' });

    await pool.query('DELETE FROM show_tracking WHERE show_id = ? AND user_id = ?', [showId, req.userId]);
    await pool.query(
      `DELETE w FROM watch_status w JOIN episodes e ON w.episode_id = e.id
       JOIN seasons se ON e.season_id = se.id WHERE se.show_id = ? AND w.user_id = ?`,
      [showId, req.userId]
    );
    // Notes et notes textuelles : celles de la série et celles de ses épisodes.
    await pool.query("DELETE FROM ratings WHERE target_type = 'show' AND target_id = ? AND user_id = ?", [
      showId,
      req.userId,
    ]);
    await pool.query("DELETE FROM notes WHERE target_type = 'show' AND target_id = ? AND user_id = ?", [
      showId,
      req.userId,
    ]);
    await pool.query(
      `DELETE r FROM ratings r JOIN episodes e ON r.target_id = e.id
       JOIN seasons se ON e.season_id = se.id
       WHERE r.target_type = 'episode' AND se.show_id = ? AND r.user_id = ?`,
      [showId, req.userId]
    );
    await pool.query(
      `DELETE n FROM notes n JOIN episodes e ON n.target_id = e.id
       JOIN seasons se ON e.season_id = se.id
       WHERE n.target_type = 'episode' AND se.show_id = ? AND n.user_id = ?`,
      [showId, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
