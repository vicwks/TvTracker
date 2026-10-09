import { Router } from 'express';
import pool from '../db/connection.js';
import { refreshShowCompletion } from '../services/showStatus.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { toPositiveInt, toRating } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const MAX_NOTE_LENGTH = 5000;

// Retourne l'id de la série d'un épisode, ou null s'il n'existe pas.
async function showIdOfEpisode(episodeId) {
  const [[row]] = await pool.query(
    'SELECT se.show_id FROM episodes e JOIN seasons se ON e.season_id = se.id WHERE e.id = ?',
    [episodeId]
  );
  return row ? row.show_id : null;
}

// Marque un épisode comme vu / non vu (pour MOI).
// Le compteur de revisionnage (watch_count) n'est jamais réduit par un décochage :
// il ne reflète que les visionnages déjà effectués, et passe à 1 au premier "vu".
router.patch('/:id/watched', async (req, res) => {
  try {
    const episodeId = toPositiveInt(req.params.id);
    if (!episodeId) return res.status(404).json({ error: 'Épisode introuvable' });
    const watched = !!req.body.watched;

    const showId = await showIdOfEpisode(episodeId);
    if (!showId) return res.status(404).json({ error: 'Épisode introuvable' });

    await pool.query(
      `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE watched = VALUES(watched), watched_at = VALUES(watched_at)${
         watched ? ', watch_count = GREATEST(watch_count, 1)' : ''
       }`,
      [req.userId, episodeId, watched, watched ? new Date() : null, watched ? 1 : 0]
    );
    await refreshShowCompletion(req.userId, [showId]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'épisode" });
  }
});

// Enregistre un nouveau visionnage de cet épisode (deuxième fois, troisième fois...).
router.post('/:id/rewatch', async (req, res) => {
  try {
    const episodeId = toPositiveInt(req.params.id);
    if (!episodeId) return res.status(404).json({ error: 'Épisode introuvable' });

    const showId = await showIdOfEpisode(episodeId);
    if (!showId) return res.status(404).json({ error: 'Épisode introuvable' });

    await pool.query(
      `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count)
       VALUES (?, ?, TRUE, NOW(), 1)
       ON DUPLICATE KEY UPDATE watched = TRUE, watched_at = NOW(), watch_count = watch_count + 1`,
      [req.userId, episodeId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement du revisionnage" });
  }
});

// Retire le dernier revisionnage d'un épisode. Le premier visionnage reste : l'épisode reste vu.
router.delete('/:id/rewatch', async (req, res) => {
  try {
    const episodeId = toPositiveInt(req.params.id);
    if (!episodeId) return res.status(404).json({ error: 'Épisode introuvable' });

    const showId = await showIdOfEpisode(episodeId);
    if (!showId) return res.status(404).json({ error: 'Épisode introuvable' });

    await pool.query(
      'UPDATE watch_status SET watch_count = watch_count - 1 WHERE user_id = ? AND episode_id = ? AND watch_count > 1',
      [req.userId, episodeId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression du revisionnage' });
  }
});

// Marque tous les épisodes d'une saison comme vus/non vus (pour MOI), en une seule requête.
router.patch('/season/:seasonId/watched-all', async (req, res) => {
  try {
    const seasonId = toPositiveInt(req.params.seasonId);
    if (!seasonId) return res.status(404).json({ error: 'Saison introuvable' });
    const watched = !!req.body.watched;

    const [[season]] = await pool.query('SELECT show_id FROM seasons WHERE id = ?', [seasonId]);
    if (!season) return res.status(404).json({ error: 'Saison introuvable' });

    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM episodes WHERE season_id = ?', [seasonId]);

    if (watched) {
      await pool.query(
        `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count)
         SELECT ?, e.id, TRUE, NOW(), 1 FROM episodes e WHERE e.season_id = ?
         ON DUPLICATE KEY UPDATE watched = TRUE, watched_at = NOW(), watch_count = GREATEST(watch_count, 1)`,
        [req.userId, seasonId]
      );
    } else {
      await pool.query(
        `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count)
         SELECT ?, e.id, FALSE, NULL, 0 FROM episodes e WHERE e.season_id = ?
         ON DUPLICATE KEY UPDATE watched = FALSE, watched_at = NULL`,
        [req.userId, seasonId]
      );
    }
    await refreshShowCompletion(req.userId, [season.show_id]);

    res.json({ ok: true, count: Number(count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la saison' });
  }
});

// Marque comme vus (pour MOI) tous les épisodes d'une saison dont le numéro est <= celui donné.
// Utilisé pour "rattraper" une série : cocher l'épisode 15 marque d'un coup les épisodes 1 à 14.
router.patch('/season/:seasonId/watched-up-to/:episodeNumber', async (req, res) => {
  try {
    const seasonId = toPositiveInt(req.params.seasonId);
    const episodeNumber = toPositiveInt(req.params.episodeNumber);
    if (!seasonId || !episodeNumber) return res.status(400).json({ error: 'Paramètres invalides' });

    const [[season]] = await pool.query('SELECT show_id FROM seasons WHERE id = ?', [seasonId]);
    if (!season) return res.status(404).json({ error: 'Saison introuvable' });

    const [result] = await pool.query(
      `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count)
       SELECT ?, e.id, TRUE, NOW(), 1 FROM episodes e WHERE e.season_id = ? AND e.episode_number <= ?
       ON DUPLICATE KEY UPDATE watched = TRUE, watched_at = NOW(), watch_count = GREATEST(watch_count, 1)`,
      [req.userId, seasonId, episodeNumber]
    );
    await refreshShowCompletion(req.userId, [season.show_id]);

    // Avec ON DUPLICATE KEY UPDATE, affectedRows vaut 1 par ligne insérée et 2 par ligne mise à jour :
    // on relit donc le nombre réel d'épisodes concernés.
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM episodes WHERE season_id = ? AND episode_number <= ?',
      [seasonId, episodeNumber]
    );
    res.json({ ok: true, count: Number(count), affected: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour groupée' });
  }
});

// Ma note sur un épisode (0 à 10)
router.post('/:id/rating', async (req, res) => {
  try {
    const episodeId = toPositiveInt(req.params.id);
    const rating = toRating(req.body.rating);
    if (!episodeId) return res.status(404).json({ error: 'Épisode introuvable' });
    if (rating === null) return res.status(400).json({ error: 'Note invalide (entre 0 et 10)' });

    if (!(await showIdOfEpisode(episodeId))) return res.status(404).json({ error: 'Épisode introuvable' });

    await pool.query(
      `INSERT INTO ratings (user_id, target_type, target_id, rating) VALUES (?, 'episode', ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.userId, episodeId, rating]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la note" });
  }
});

// Ma note texte libre sur un épisode
router.post('/:id/note', async (req, res) => {
  try {
    const episodeId = toPositiveInt(req.params.id);
    const { content } = req.body;
    if (!episodeId) return res.status(404).json({ error: 'Épisode introuvable' });
    if (typeof content !== 'string') return res.status(400).json({ error: 'Contenu de la note invalide' });
    if (content.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({ error: `La note ne peut pas dépasser ${MAX_NOTE_LENGTH} caractères` });
    }

    if (!(await showIdOfEpisode(episodeId))) return res.status(404).json({ error: 'Épisode introuvable' });

    await pool.query(
      `INSERT INTO notes (user_id, target_type, target_id, content) VALUES (?, 'episode', ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content)`,
      [req.userId, episodeId, content]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la note" });
  }
});

export default router;
