import { Router } from 'express';
import pool from '../db/connection.js';
import { getShowDetails, getMovieDetails, IMAGE_BASE_URL } from '../services/tmdb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cached } from '../services/cache.js';
import { TARGET_TYPES, toPositiveInt } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const DETAILS_TTL = 60 * 60 * 1000;

// Ajoute une série ou un film à MA watchlist
router.post('/', async (req, res) => {
  try {
    const { target_type, title, poster_path } = req.body;
    const tmdbId = toPositiveInt(req.body.tmdb_id);
    if (!TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({ error: 'target_type doit être "show" ou "movie"' });
    }
    if (!tmdbId) return res.status(400).json({ error: 'tmdb_id requis' });

    await pool.query(
      `INSERT INTO watchlist (user_id, target_type, target_id, added_at) VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE added_at = added_at`,
      [req.userId, target_type, tmdbId]
    );
    res.status(201).json({ ok: true, title, poster_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'ajout à la watchlist" });
  }
});

// Titres et affiches : on lit d'abord le cache local (séries et films déjà en base),
// puis TMDB seulement pour les éléments absents, avec un cache de détails d'une heure.
async function loadLocalInfo(rows) {
  const showIds = rows.filter((r) => r.target_type === 'show').map((r) => r.target_id);
  const movieIds = rows.filter((r) => r.target_type === 'movie').map((r) => r.target_id);
  const info = new Map();

  if (showIds.length) {
    const [shows] = await pool.query('SELECT tmdb_id, title, poster_path FROM shows WHERE tmdb_id IN (?)', [showIds]);
    for (const s of shows) info.set(`show:${s.tmdb_id}`, { title: s.title, poster_path: s.poster_path });
  }
  if (movieIds.length) {
    const [movies] = await pool.query('SELECT tmdb_id, title, poster_path FROM movies WHERE tmdb_id IN (?)', [movieIds]);
    for (const m of movies) info.set(`movie:${m.tmdb_id}`, { title: m.title, poster_path: m.poster_path });
  }
  return info;
}

// Liste MA watchlist (titres et affiches issus du cache local, puis de TMDB si besoin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC', [
      req.userId,
    ]);
    const localInfo = await loadLocalInfo(rows);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const local = localInfo.get(`${row.target_type}:${row.target_id}`);
        if (local) {
          return {
            ...row,
            title: local.title,
            poster_url: local.poster_path ? `${IMAGE_BASE_URL}${local.poster_path}` : null,
          };
        }
        try {
          if (row.target_type === 'show') {
            const details = await cached(`details:show:${row.target_id}`, DETAILS_TTL, () =>
              getShowDetails(row.target_id)
            );
            return {
              ...row,
              title: details.name,
              poster_url: details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : null,
            };
          }
          const details = await cached(`details:movie:${row.target_id}`, DETAILS_TTL, () =>
            getMovieDetails(row.target_id)
          );
          return {
            ...row,
            title: details.title,
            poster_url: details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : null,
          };
        } catch {
          return { ...row, title: '(introuvable sur TMDB)', poster_url: null };
        }
      })
    );
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la watchlist' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(404).json({ error: 'Élément introuvable' });

    await pool.query('DELETE FROM watchlist WHERE id = ? AND user_id = ?', [id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
