import { Router } from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { IMAGE_BASE_URL } from '../services/tmdb.js';
import { MAX_PLAUSIBLE_RUNTIME } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

// Durée maximale retenue pour un film : au-delà, la donnée est considérée comme aberrante.
const MAX_MOVIE_RUNTIME = 360;
const TOP_LIMIT = 5;
const GENRE_LIMIT = 8;

// Toutes les statistiques ne comptent que ce qui a été réellement vu : épisodes cochés et films marqués
// comme vus. Les séries « à voir », la watchlist et les films non vus n'entrent jamais dans le calcul.
// Cette requête donne la date de chaque visionnage, pour les rythmes et les séries de jours.
const WATCHED_AT_SQL = `
  SELECT w.watched_at FROM watch_status w
   WHERE w.user_id = ? AND w.watched = TRUE AND w.watched_at IS NOT NULL
  UNION ALL
  SELECT ms.watched_at FROM movie_status ms
   WHERE ms.user_id = ? AND ms.watched = TRUE AND ms.watched_at IS NOT NULL`;

function splitGenres(value) {
  return value ? value.split(',').map((g) => g.trim()).filter(Boolean) : [];
}

function posterUrl(path) {
  return path ? `${IMAGE_BASE_URL}${path}` : null;
}

// Jours consécutifs : la plus longue suite de l'histoire, et la suite en cours (qui doit finir aujourd'hui ou hier).
function streaks(days) {
  const sorted = [...new Set(days)].sort(); // les dates AAAA-MM-JJ se trient comme des dates
  const toDayNumber = (day) => Date.parse(`${day}T00:00:00Z`) / 86400000;

  let longest = 0;
  let run = 0;
  let previous = null;
  for (const day of sorted) {
    const current = toDayNumber(day);
    run = previous !== null && current - previous === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = current;
  }

  let current = 0;
  if (sorted.length > 0) {
    const today = toDayNumber(new Date().toISOString().slice(0, 10));
    let expected = toDayNumber(sorted[sorted.length - 1]);
    if (today - expected <= 1) {
      current = 1;
      for (let i = sorted.length - 2; i >= 0 && expected - toDayNumber(sorted[i]) === 1; i--) {
        current += 1;
        expected = toDayNumber(sorted[i]);
      }
    }
  }
  return { longest, current };
}

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

    // Séries avec au moins un épisode vu : minutes et nombre d'épisodes vus, par série.
    const [showRows] = await pool.query(
      `SELECT s.id, s.title, s.poster_path, s.genres,
              SUM(LEAST(COALESCE(e.runtime, s.episode_runtime, 0), ?)) AS minutes,
              COUNT(*) AS episodes
         FROM watch_status w
         JOIN episodes e ON e.id = w.episode_id
         JOIN seasons se ON e.season_id = se.id
         JOIN shows s ON se.show_id = s.id
        WHERE w.watched = TRUE AND w.user_id = ?
        GROUP BY s.id, s.title, s.poster_path, s.genres`,
      [MAX_PLAUSIBLE_RUNTIME, userId]
    );

    // Films vus, avec leur note personnelle s'ils en ont une.
    const [movieRows] = await pool.query(
      `SELECT m.id, m.title, m.poster_path, m.genres,
              LEAST(COALESCE(m.runtime, 0), ?) AS minutes, r.rating
         FROM movie_status ms
         JOIN movies m ON m.id = ms.movie_id
         LEFT JOIN ratings r ON r.target_type = 'movie' AND r.target_id = m.id AND r.user_id = ms.user_id
        WHERE ms.watched = TRUE AND ms.user_id = ?`,
      [MAX_MOVIE_RUNTIME, userId]
    );

    // Répartition par genre, en minutes réellement vues (une série ou un film compte dans chacun de ses genres).
    const genreTotals = new Map();
    const addGenres = (value, minutes) => {
      for (const name of splitGenres(value)) {
        const entry = genreTotals.get(name) || { name, minutes: 0, count: 0 };
        entry.minutes += minutes;
        entry.count += 1;
        genreTotals.set(name, entry);
      }
    };
    for (const row of showRows) addGenres(row.genres, Number(row.minutes));
    for (const row of movieRows) addGenres(row.genres, Number(row.minutes));
    const genres = [...genreTotals.values()]
      .sort((a, b) => b.minutes - a.minutes || b.count - a.count)
      .slice(0, GENRE_LIMIT);

    const topShows = showRows
      .map((r) => ({
        id: r.id,
        title: r.title,
        poster_url: posterUrl(r.poster_path),
        minutes: Number(r.minutes),
        episodes: Number(r.episodes),
      }))
      .sort((a, b) => b.minutes - a.minutes || b.episodes - a.episodes)
      .slice(0, TOP_LIMIT);

    const topMovies = movieRows
      .filter((r) => r.rating !== null)
      .map((r) => ({ id: r.id, title: r.title, poster_url: posterUrl(r.poster_path), rating: Number(r.rating) }))
      .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title))
      .slice(0, TOP_LIMIT);

    // Notes données à des épisodes ou à des films vus (sur 10, comme en base).
    const [ratingRows] = await pool.query(
      `SELECT r.rating FROM ratings r
         JOIN watch_status w ON w.episode_id = r.target_id AND w.user_id = r.user_id AND w.watched = TRUE
        WHERE r.user_id = ? AND r.target_type = 'episode'
       UNION ALL
       SELECT r.rating FROM ratings r
         JOIN movie_status ms ON ms.movie_id = r.target_id AND ms.user_id = r.user_id AND ms.watched = TRUE
        WHERE r.user_id = ? AND r.target_type = 'movie'`,
      [userId, userId]
    );
    const ratingValues = ratingRows.map((r) => Number(r.rating));
    const averageRating = ratingValues.length
      ? Math.round((ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length) * 10) / 10
      : null;

    // Revisionnages : chaque visionnage au-delà du premier d'un épisode déjà vu.
    const [[rewatch]] = await pool.query(
      'SELECT COALESCE(SUM(GREATEST(watch_count - 1, 0)), 0) AS rewatches FROM watch_status WHERE user_id = ? AND watched = TRUE',
      [userId]
    );

    const [[completed]] = await pool.query(
      "SELECT COUNT(*) AS count FROM show_tracking WHERE user_id = ? AND status = 'completed'",
      [userId]
    );

    // Jours où quelque chose a été vu : base des séries de jours.
    const [dayRows] = await pool.query(
      `SELECT DISTINCT DATE_FORMAT(x.watched_at, '%Y-%m-%d') AS day FROM (${WATCHED_AT_SQL}) x`,
      [userId, userId]
    );
    const days = dayRows.map((r) => r.day);
    const { longest, current } = streaks(days);

    // Rythme : nombre de visionnages par jour de la semaine (0 = lundi) et par heure.
    const [weekdayRows] = await pool.query(
      `SELECT WEEKDAY(x.watched_at) AS d, COUNT(*) AS count FROM (${WATCHED_AT_SQL}) x GROUP BY d`,
      [userId, userId]
    );
    const [hourRows] = await pool.query(
      `SELECT HOUR(x.watched_at) AS h, COUNT(*) AS count FROM (${WATCHED_AT_SQL}) x GROUP BY h`,
      [userId, userId]
    );
    const weekdays = Array.from({ length: 7 }, () => 0);
    for (const r of weekdayRows) weekdays[Number(r.d)] = Number(r.count);
    const hours = Array.from({ length: 24 }, () => 0);
    for (const r of hourRows) hours[Number(r.h)] = Number(r.count);

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
      showsStarted: showRows.length,
      showsCompleted: Number(completed.count),
      rewatches: Number(rewatch.rewatches),
      averageRating,
      ratedCount: ratingValues.length,
      daysWatched: days.length,
      longestStreak: longest,
      currentStreak: current,
      monthly: monthly.map((r) => ({ month: r.month, count: Number(r.count) })),
      genres,
      topShows,
      topMovies,
      weekdays,
      hours,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});

export default router;
