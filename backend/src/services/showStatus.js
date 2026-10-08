import pool from '../db/connection.js';

// Recalcule le statut "terminé" / "en cours" d'un utilisateur pour ses séries suivies, en fonction
// de SA progression personnelle :
// - passe à "completed" si tous les épisodes sont vus par cet utilisateur
// - repasse de "completed" à "watching" si un épisode redevient non vu
// Les statuts "to_watch", "paused" et "dropped" ne sont jamais changés automatiquement,
// sauf passage à "completed" si l'utilisateur a coché tous les épisodes.
//
// showIds: liste optionnelle pour limiter le calcul à certaines séries. Sans liste, toutes les séries
// suivies par l'utilisateur sont recalculées, en deux requêtes au total.
export async function refreshShowCompletion(userId, showIds = null) {
  if (showIds && showIds.length === 0) return;

  const params = [userId];
  let scope = '';
  if (showIds) {
    scope = `AND st.show_id IN (?)`;
    params.push(showIds);
  }

  const [rows] = await pool.query(
    `SELECT st.show_id, st.status,
            COUNT(e.id) AS total,
            COALESCE(SUM(w.watched), 0) AS watched
     FROM show_tracking st
     LEFT JOIN seasons se ON se.show_id = st.show_id
     LEFT JOIN episodes e ON e.season_id = se.id
     LEFT JOIN watch_status w ON w.episode_id = e.id AND w.user_id = st.user_id
     WHERE st.user_id = ? ${scope}
     GROUP BY st.show_id, st.status`,
    params
  );

  const toCompleted = [];
  const toWatching = [];
  for (const row of rows) {
    const total = Number(row.total);
    const isFullyWatched = total > 0 && Number(row.watched) === total;
    if (isFullyWatched && row.status !== 'completed') toCompleted.push(row.show_id);
    else if (!isFullyWatched && row.status === 'completed') toWatching.push(row.show_id);
  }

  if (toCompleted.length > 0) {
    await pool.query("UPDATE show_tracking SET status = 'completed' WHERE user_id = ? AND show_id IN (?)", [
      userId,
      toCompleted,
    ]);
  }
  if (toWatching.length > 0) {
    await pool.query("UPDATE show_tracking SET status = 'watching' WHERE user_id = ? AND show_id IN (?)", [
      userId,
      toWatching,
    ]);
  }
}
