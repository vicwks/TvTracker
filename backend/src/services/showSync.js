import pool from '../db/connection.js';
import { getShowDetails, getSeasonDetails, getEpisodeGroup } from './tmdb.js';
import { sanitizeRuntime } from '../utils/validation.js';

// Par défaut, une série synchronisée il y a moins de 24h n'est pas redemandée à TMDB.
const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

// Séries dont la numérotation par défaut de TMDB range tous les épisodes dans une seule saison (Jujutsu Kaisen
// : 59 épisodes en « saison 1 »). Pour ces séries, les saisons viennent d'un groupe d'épisodes TMDB « Seasons ».
// Ajouter une série ici : vérifier d'abord que le groupe donne le bon nombre de saisons et d'épisodes.
export const EPISODE_GROUP_OVERRIDES = {
  95479: '64a3fc4fe9da6900ae2fa807', // Jujutsu Kaisen : saisons 1, 2 et 3
  65942: '641eb9d6b234b9007ac67063', // Re:ZERO : saisons 1 à 4
  220542: '6782169d78cfcd77ed4e89be', // Les Carnets de l'apothicaire : saisons 1 à 3
};

// Reconstruit les saisons d'une série à partir d'un groupe d'épisodes TMDB. Les épisodes déjà stockés sont
// déplacés (même identifiant TMDB), pas recréés : leur progression (watch_status) est conservée.
// Tout se fait dans une transaction ; les épisodes absents du groupe sont supprimés.
async function syncSeasonsFromGroup(showId, groupId) {
  const group = await getEpisodeGroup(groupId);
  // order 0 = « Specials » : exclues, comme les saisons spéciales (saison 0) de la synchronisation par défaut.
  const seasons = group.groups.filter((g) => g.order > 0).sort((a, b) => a.order - b.order);
  const desired = seasons.flatMap((g) => g.episodes.map((ep, i) => ({ seasonNumber: g.order, number: i + 1, ep })));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const s of seasons) {
      await connection.query(
        `INSERT INTO seasons (show_id, season_number, name) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [showId, s.order, `Saison ${s.order}`]
      );
    }
    const [seasonRows] = await connection.query('SELECT id, season_number FROM seasons WHERE show_id = ?', [showId]);
    const seasonIdByNumber = new Map(seasonRows.map((r) => [r.season_number, r.id]));

    const [existing] = await connection.query(
      'SELECT e.id, e.tmdb_id FROM episodes e JOIN seasons se ON se.id = e.season_id WHERE se.show_id = ?',
      [showId]
    );
    const existingByTmdb = new Map(existing.filter((e) => e.tmdb_id).map((e) => [e.tmdb_id, e.id]));

    // Étape 1 : les épisodes existants passent en numéros négatifs, uniques. Ainsi, en les déplaçant une
    // à une, aucun ne peut entrer en conflit avec le couple (saison, numéro) d'un autre épisode.
    await connection.query(
      'UPDATE episodes e JOIN seasons se ON se.id = e.season_id SET e.episode_number = -e.id WHERE se.show_id = ?',
      [showId]
    );

    // Étape 2 : chaque épisode du groupe reçoit sa saison et son numéro. Connu : déplacé. Inconnu : créé.
    for (const { seasonNumber, number, ep } of desired) {
      const seasonId = seasonIdByNumber.get(seasonNumber);
      const existingId = existingByTmdb.get(ep.id);
      const fields = [
        seasonId,
        number,
        ep.name ?? null,
        ep.overview ?? null,
        ep.air_date || null,
        sanitizeRuntime(ep.runtime),
        ep.still_path ?? null,
      ];
      if (existingId) {
        await connection.query(
          `UPDATE episodes SET season_id = ?, episode_number = ?, title = ?, overview = ?, air_date = ?, runtime = ?, still_path = ?
           WHERE id = ?`,
          [...fields, existingId]
        );
        existingByTmdb.delete(ep.id);
      } else {
        await connection.query(
          `INSERT INTO episodes (season_id, tmdb_id, episode_number, title, overview, air_date, runtime, still_path)
           VALUES (?,?,?,?,?,?,?,?)`,
          [seasonId, ep.id, ...fields.slice(1)]
        );
      }
    }

    // Étape 3 : ce qui reste à numéro négatif n'existe plus dans le groupe. On le retire, puis les saisons
    // qui ne figurent plus dans le groupe (la saison 0 n'est jamais stockée, on ne la touche pas).
    await connection.query(
      'DELETE e FROM episodes e JOIN seasons se ON se.id = e.season_id WHERE se.show_id = ? AND e.episode_number < 0',
      [showId]
    );
    await connection.query(
      'DELETE FROM seasons WHERE show_id = ? AND season_number <> 0 AND season_number NOT IN (?)',
      [showId, seasons.map((s) => s.order)]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

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

  if (EPISODE_GROUP_OVERRIDES[tmdbId]) {
    await syncSeasonsFromGroup(showId, EPISODE_GROUP_OVERRIDES[tmdbId]);
    return showId;
  }

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
