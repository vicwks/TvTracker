import pool from '../db/connection.js';

// Pour une liste de tmdb_id, retourne une map { tmdb_id: id local } des séries ou films déjà suivis par
// l'utilisateur. Un titre absent de la map n'est pas suivi. `type` : "show" ou "movie", comme ailleurs.
export async function getTrackedMap(userId, tmdbIds, type) {
  if (tmdbIds.length === 0) return {};

  const [rows] =
    type === 'show'
      ? await pool.query(
          `SELECT s.tmdb_id, s.id FROM shows s
           JOIN show_tracking t ON t.show_id = s.id AND t.user_id = ?
           WHERE s.tmdb_id IN (?)`,
          [userId, tmdbIds]
        )
      : await pool.query(
          `SELECT m.tmdb_id, m.id FROM movies m
           JOIN movie_status ms ON ms.movie_id = m.id AND ms.user_id = ?
           WHERE m.tmdb_id IN (?)`,
          [userId, tmdbIds]
        );

  const map = {};
  for (const row of rows) map[row.tmdb_id] = row.id;
  return map;
}
