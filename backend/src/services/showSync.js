import pool from '../db/connection.js';
import { getShowDetails, getSeasonDetails } from './tmdb.js';
import { sanitizeRuntime } from '../utils/validation.js';

// Par défaut, une série synchronisée il y a moins de 24h n'est pas redemandée à TMDB.
const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

// Crée ou met à jour une série + ses saisons + ses épisodes à partir de son tmdb_id.
// Retourne l'id local (shows.id).
// - force: true ignore la fraîcheur et rappelle TMDB (bouton "Rafraîchir", tâche planifiée).
// - Les écritures sont des upserts : deux synchronisations simultanées ne provoquent pas de doublon.
export async function syncShowFromTmdb(tmdbId, { force = false, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {}) {
  if (!force) {
    const [[existing]] = await pool.query(
      'SELECT id, synced_at > NOW() - INTERVAL ? SECOND AS fresh FROM shows WHERE tmdb_id = ?',
      [maxAgeSeconds, tmdbId]
    );
    if (existing && existing.fresh) return existing.id;
  }

  const details = await getShowDetails(tmdbId);

  const genres = (details.genres || []).map((g) => g.name).join(', ');
  const episodeRuntime = sanitizeRuntime(
    Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0
      ? details.episode_run_time[0]
      : details.last_episode_to_air?.runtime || details.next_episode_to_air?.runtime || null
  );

  await pool.query(
    `INSERT INTO shows (tmdb_id, title, overview, poster_path, backdrop_path, first_air_date, genres, tmdb_status, vote_average, episode_runtime, synced_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,NOW())
     ON DUPLICATE KEY UPDATE title=VALUES(title), overview=VALUES(overview), poster_path=VALUES(poster_path),
       backdrop_path=VALUES(backdrop_path), first_air_date=VALUES(first_air_date), genres=VALUES(genres),
       tmdb_status=VALUES(tmdb_status), vote_average=VALUES(vote_average), episode_runtime=VALUES(episode_runtime),
       synced_at=NOW()`,
    [
      tmdbId,
      details.name,
      details.overview,
      details.poster_path,
      details.backdrop_path,
      details.first_air_date || null,
      genres,
      details.status,
      details.vote_average,
      episodeRuntime,
    ]
  );
  const [[show]] = await pool.query('SELECT id FROM shows WHERE tmdb_id = ?', [tmdbId]);
  const showId = show.id;

  // Saisons hors "Spéciaux" (saison 0 côté TMDB) : bonus (pubs, making-of) que la plupart des
  // utilisateurs ne considèrent pas comme de vrais épisodes.
  for (const season of (details.seasons || []).filter((s) => s.season_number !== 0)) {
    const seasonDetails = await getSeasonDetails(tmdbId, season.season_number);

    await pool.query(
      `INSERT INTO seasons (show_id, tmdb_id, season_number, name, poster_path, air_date) VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE tmdb_id=VALUES(tmdb_id), name=VALUES(name), poster_path=VALUES(poster_path), air_date=VALUES(air_date)`,
      [showId, season.id, season.season_number, season.name, season.poster_path, season.air_date || null]
    );
    const [[seasonRow]] = await pool.query('SELECT id FROM seasons WHERE show_id = ? AND season_number = ?', [
      showId,
      season.season_number,
    ]);

    const episodes = seasonDetails.episodes || [];
    if (episodes.length === 0) continue;

    // Une seule requête par saison, quel que soit le nombre d'épisodes.
    // Pas besoin de pré-créer une ligne watch_status : l'absence de ligne signifie "non vu".
    await pool.query(
      `INSERT INTO episodes (season_id, tmdb_id, episode_number, title, overview, air_date, runtime, still_path) VALUES ?
       ON DUPLICATE KEY UPDATE tmdb_id=VALUES(tmdb_id), title=VALUES(title), overview=VALUES(overview),
         air_date=VALUES(air_date), runtime=VALUES(runtime), still_path=VALUES(still_path)`,
      [
        episodes.map((ep) => [
          seasonRow.id,
          ep.id ?? null,
          ep.episode_number,
          ep.name ?? null,
          ep.overview ?? null,
          ep.air_date || null,
          sanitizeRuntime(ep.runtime),
          ep.still_path ?? null,
        ]),
      ]
    );
  }

  return showId;
}
