import pool from '../db/connection.js';
import { searchShows } from './tmdb.js';
import { syncShowFromTmdb } from './showSync.js';
import { pickBestMatch } from './matching.js';
import { SHOW_STATUSES } from '../utils/validation.js';

// Importe une série pour un utilisateur : la retrouve sur TMDB, la met dans son suivi, puis marque
// les épisodes indiqués comme vus. Utilisé par la route /api/import et par le script TV Time.
//
// item: { title, year?, status?, watched_episodes?: [{ season, episode }] }
// Retourne toujours un objet de rapport : une série en erreur n'interrompt pas un import en lot.
export async function importShowForUser(userId, item, { defaultStatus = 'to_watch' } = {}) {
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) return { title: item.title ?? null, status: 'erreur', message: 'titre manquant' };

  try {
    const results = await searchShows(title);
    const match = pickBestMatch(results, title, item.year);
    if (!match) return { title, status: 'non_trouve' };

    const showId = await syncShowFromTmdb(match.id);
    const trackingStatus = SHOW_STATUSES.includes(item.status) ? item.status : defaultStatus;

    await pool.query(
      `INSERT INTO show_tracking (user_id, show_id, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [userId, showId, trackingStatus]
    );

    const wanted = Array.isArray(item.watched_episodes) ? item.watched_episodes : [];
    let markedCount = 0;
    if (wanted.length > 0) {
      // Une seule lecture des épisodes de la série, puis correspondance en mémoire.
      const [episodes] = await pool.query(
        `SELECT e.id, se.season_number, e.episode_number FROM episodes e
         JOIN seasons se ON e.season_id = se.id
         WHERE se.show_id = ?`,
        [showId]
      );
      const episodeIds = new Map(episodes.map((e) => [`${e.season_number}:${e.episode_number}`, e.id]));

      const toMark = new Set();
      for (const ep of wanted) {
        const id = episodeIds.get(`${Number(ep.season)}:${Number(ep.episode)}`);
        if (id) toMark.add(id);
      }

      if (toMark.size > 0) {
        const now = new Date();
        await pool.query(
          `INSERT INTO watch_status (user_id, episode_id, watched, watched_at, watch_count) VALUES ?
           ON DUPLICATE KEY UPDATE watched = TRUE, watched_at = VALUES(watched_at), watch_count = GREATEST(watch_count, 1)`,
          [[...toMark].map((episodeId) => [userId, episodeId, true, now, 1])]
        );
        markedCount = toMark.size;
      }
    }

    return {
      title,
      status: 'importe',
      matched_title: match.name,
      matched_tmdb_id: match.id,
      episodes_marques: markedCount,
      episodes_demandes: wanted.length,
    };
  } catch (err) {
    return { title, status: 'erreur', message: err.message };
  }
}
