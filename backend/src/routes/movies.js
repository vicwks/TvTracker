import { Router } from 'express';
import pool from '../db/connection.js';
import { getMovieDetails, IMAGE_BASE_URL, isNotFoundError } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { toPositiveInt, toRating } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const MAX_NOTE_LENGTH = 5000;

// Retourne l'id local du film, en le téléchargeant depuis TMDB s'il n'est pas encore en cache.
// Retourne null si TMDB ne connaît pas ce film.
async function ensureMovieCached(tmdbId) {
  const [[existing]] = await pool.query('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
  if (existing) return existing.id;

  let details;
  try {
    details = await getMovieDetails(tmdbId);
  } catch (err) {
    if (isNotFoundError(err)) return null;
    throw err;
  }

  const genres = (details.genres || []).map((g) => g.name).join(', ');
  // ON DUPLICATE KEY : deux requêtes simultanées pour le même film ne provoquent pas d'erreur.
  await pool.query(
    `INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path, release_date, genres, runtime, vote_average)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE title = title`,
    [
      tmdbId,
      details.title,
      details.overview,
      details.poster_path,
      details.backdrop_path,
      details.release_date || null,
      genres,
      details.runtime,
      details.vote_average,
    ]
  );
  const [[row]] = await pool.query('SELECT id FROM movies WHERE tmdb_id = ?', [tmdbId]);
  return row.id;
}

async function movieExists(movieId) {
  const [[row]] = await pool.query('SELECT id FROM movies WHERE id = ?', [movieId]);
  return !!row;
}

// Résout un tmdb_id vers l'id local (met en cache le film si besoin), SANS créer de suivi.
router.get('/resolve/:tmdbId', async (req, res) => {
  try {
    const tmdbId = toPositiveInt(req.params.tmdbId);
    if (!tmdbId) return res.status(400).json({ error: 'Identifiant TMDB invalide' });

    const movieId = await ensureMovieCached(tmdbId);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable sur TMDB' });
    res.json({ id: movieId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération du film' });
  }
});

// Ajoute un film à MON suivi (le film lui-même est mis en cache globalement)
router.post('/', async (req, res) => {
  try {
    const tmdbId = toPositiveInt(req.body.tmdb_id);
    if (!tmdbId) return res.status(400).json({ error: 'tmdb_id requis' });

    const movieId = await ensureMovieCached(tmdbId);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable sur TMDB' });

    await pool.query(
      `INSERT INTO movie_status (user_id, movie_id, watched) VALUES (?, ?, FALSE)
       ON DUPLICATE KEY UPDATE movie_id = movie_id`,
      [req.userId, movieId]
    );

    res.status(201).json({ id: movieId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout du film" });
  }
});

// Liste MES films suivis
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, ms.watched, ms.watched_at, r.rating
      FROM movies m
      JOIN movie_status ms ON ms.movie_id = m.id AND ms.user_id = ?
      LEFT JOIN ratings r ON r.target_type = 'movie' AND r.target_id = m.id AND r.user_id = ?
      ORDER BY m.title ASC`,
      [req.userId, req.userId]
    );
    res.json(
      rows.map((r) => ({
        ...r,
        watched: !!r.watched,
        poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des films' });
  }
});

// Détail d'un film (avec MON statut/note/notes). Fonctionne même si le film n'est pas
// encore suivi (prévisualisation depuis la recherche/découverte) : watched vaut alors false.
router.get('/:id', async (req, res) => {
  try {
    const movieId = toPositiveInt(req.params.id);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable' });

    const [[movie]] = await pool.query(
      `SELECT m.*, ms.watched, ms.watched_at, r.rating
       FROM movies m
       LEFT JOIN movie_status ms ON ms.movie_id = m.id AND ms.user_id = ?
       LEFT JOIN ratings r ON r.target_type = 'movie' AND r.target_id = m.id AND r.user_id = ?
       WHERE m.id = ?`,
      [req.userId, req.userId, movieId]
    );
    if (!movie) return res.status(404).json({ error: 'Film introuvable' });

    const [[noteRow]] = await pool.query(
      "SELECT content FROM notes WHERE target_type='movie' AND target_id = ? AND user_id = ?",
      [movieId, req.userId]
    );

    res.json({
      ...movie,
      watched: !!movie.watched,
      poster_url: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : null,
      note: noteRow ? noteRow.content : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération du film' });
  }
});

// Marque un film comme vu / non vu (pour MOI). Crée la ligne de suivi si elle n'existait pas.
router.patch('/:id/watched', async (req, res) => {
  try {
    const movieId = toPositiveInt(req.params.id);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable' });
    if (!(await movieExists(movieId))) return res.status(404).json({ error: 'Film introuvable' });

    const watched = !!req.body.watched;
    // watched_at est posé par la base (même horloge que les épisodes, NOW()).
    await pool.query(
      `INSERT INTO movie_status (user_id, movie_id, watched, watched_at) VALUES (?, ?, ?, ${watched ? 'NOW()' : 'NULL'})
       ON DUPLICATE KEY UPDATE watched = VALUES(watched), watched_at = VALUES(watched_at)`,
      [req.userId, movieId, watched]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du film' });
  }
});

// Ma note sur un film (0 à 10)
router.post('/:id/rating', async (req, res) => {
  try {
    const movieId = toPositiveInt(req.params.id);
    const rating = toRating(req.body.rating);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable' });
    if (rating === null) return res.status(400).json({ error: 'Note invalide (entre 0 et 10)' });
    if (!(await movieExists(movieId))) return res.status(404).json({ error: 'Film introuvable' });

    await pool.query(
      `INSERT INTO ratings (user_id, target_type, target_id, rating) VALUES (?, 'movie', ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.userId, movieId, rating]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la note" });
  }
});

// Ma note textuelle sur un film
router.post('/:id/note', async (req, res) => {
  try {
    const movieId = toPositiveInt(req.params.id);
    const { content } = req.body;
    if (!movieId) return res.status(404).json({ error: 'Film introuvable' });
    if (typeof content !== 'string') return res.status(400).json({ error: 'Contenu de la note invalide' });
    if (content.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({ error: `La note ne peut pas dépasser ${MAX_NOTE_LENGTH} caractères` });
    }
    if (!(await movieExists(movieId))) return res.status(404).json({ error: 'Film introuvable' });

    await pool.query(
      `INSERT INTO notes (user_id, target_type, target_id, content) VALUES (?, 'movie', ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content)`,
      [req.userId, movieId, content]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la note" });
  }
});

// Retire le film de MON suivi uniquement
router.delete('/:id', async (req, res) => {
  try {
    const movieId = toPositiveInt(req.params.id);
    if (!movieId) return res.status(404).json({ error: 'Film introuvable' });

    await pool.query('DELETE FROM movie_status WHERE movie_id = ? AND user_id = ?', [movieId, req.userId]);
    await pool.query("DELETE FROM ratings WHERE target_type = 'movie' AND target_id = ? AND user_id = ?", [
      movieId,
      req.userId,
    ]);
    await pool.query("DELETE FROM notes WHERE target_type = 'movie' AND target_id = ? AND user_id = ?", [
      movieId,
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
