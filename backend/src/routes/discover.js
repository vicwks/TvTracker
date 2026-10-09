import { Router } from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cached } from '../services/cache.js';
import { toPositiveInt } from '../utils/validation.js';
import { getTrackedMap } from '../services/tracking.js';
import {
  getTrendingShows,
  getTrendingMovies,
  getShowGenres,
  getMovieGenres,
  discoverShowsByGenre,
  discoverMoviesByGenre,
  IMAGE_BASE_URL,
} from '../services/tmdb.js';

const router = Router();
router.use(requireAuth);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
// Tendances et découverte changent lentement : un cache de 30 min suffit et épargne le quota TMDB.
const TRENDING_TTL = 30 * MINUTE;
// Les listes de genres ne changent presque jamais.
const GENRES_TTL = 24 * HOUR;

// Pour une liste de tmdb_id, retourne une map { tmdb_id: [ {username, display_name, avatar_url} ] }
// des amis de l'utilisateur qui suivent activement (statut "watching") chacune de ces séries.
async function getFriendsWatchingMap(userId, tmdbIds, type) {
  if (tmdbIds.length === 0) return {};

  const table = type === 'show' ? 'shows' : 'movies';
  const trackingTable = type === 'show' ? 'show_tracking' : 'movie_status';
  const trackingColumn = type === 'show' ? 'show_id' : 'movie_id';
  const watchedCondition = type === 'show' ? "t.status = 'watching'" : 't.watched = TRUE';

  const [rows] = await pool.query(
    `SELECT c.tmdb_id, u.username, u.display_name, u.avatar_url
     FROM ${table} c
     JOIN ${trackingTable} t ON t.${trackingColumn} = c.id
     JOIN users u ON u.id = t.user_id
     JOIN friendships f ON f.status = 'accepted'
       AND ((f.requester_id = ? AND f.addressee_id = u.id) OR (f.addressee_id = ? AND f.requester_id = u.id))
     WHERE c.tmdb_id IN (?) AND ${watchedCondition}`,
    [userId, userId, tmdbIds]
  );

  const map = {};
  for (const row of rows) {
    if (!map[row.tmdb_id]) map[row.tmdb_id] = [];
    map[row.tmdb_id].push({ username: row.username, display_name: row.display_name, avatar_url: row.avatar_url });
  }
  return map;
}

function formatShowResults(results) {
  return results.map((r) => ({
    tmdb_id: r.id,
    title: r.name,
    overview: r.overview,
    poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
    first_air_date: r.first_air_date,
    vote_average: r.vote_average,
  }));
}

function formatMovieResults(results) {
  return results.map((r) => ({
    tmdb_id: r.id,
    title: r.title,
    overview: r.overview,
    poster_url: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : null,
    release_date: r.release_date,
    vote_average: r.vote_average,
  }));
}

async function attachFriends(req, items, type) {
  const map = await getFriendsWatchingMap(
    req.userId,
    items.map((i) => i.tmdb_id),
    type
  );
  const tracked = await getTrackedMap(req.userId, items.map((i) => i.tmdb_id), type);
  return items.map((i) => ({ ...i, friendsWatching: map[i.tmdb_id] || [], tracked_id: tracked[i.tmdb_id] ?? null }));
}

// Numéro de page TMDB : entier entre 1 et 500 (la limite de l'API), 1 par défaut.
function parsePage(value) {
  const page = parseInt(value, 10);
  return Number.isInteger(page) ? Math.min(Math.max(page, 1), 500) : 1;
}

router.get('/trending/shows', async (req, res) => {
  try {
    const results = await cached('trending:shows', TRENDING_TTL, () => getTrendingShows());
    res.json(await attachFriends(req, formatShowResults(results), 'show'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

router.get('/trending/movies', async (req, res) => {
  try {
    const results = await cached('trending:movies', TRENDING_TTL, () => getTrendingMovies());
    res.json(await attachFriends(req, formatMovieResults(results), 'movie'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des tendances' });
  }
});

router.get('/genres/shows', async (req, res) => {
  try {
    res.json(await cached('genres:shows', GENRES_TTL, () => getShowGenres()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des genres' });
  }
});

router.get('/genres/movies', async (req, res) => {
  try {
    res.json(await cached('genres:movies', GENRES_TTL, () => getMovieGenres()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des genres' });
  }
});

router.get('/by-genre/shows/:genreId', async (req, res) => {
  try {
    const genreId = toPositiveInt(req.params.genreId);
    if (!genreId) return res.status(400).json({ error: 'Genre invalide' });
    const page = parsePage(req.query.page);

    const results = await cached(`discover:shows:${genreId}:${page}`, TRENDING_TTL, () =>
      discoverShowsByGenre(genreId, page)
    );
    res.json(await attachFriends(req, formatShowResults(results), 'show'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la découverte par genre' });
  }
});

router.get('/by-genre/movies/:genreId', async (req, res) => {
  try {
    const genreId = toPositiveInt(req.params.genreId);
    if (!genreId) return res.status(400).json({ error: 'Genre invalide' });
    const page = parsePage(req.query.page);

    const results = await cached(`discover:movies:${genreId}:${page}`, TRENDING_TTL, () =>
      discoverMoviesByGenre(genreId, page)
    );
    res.json(await attachFriends(req, formatMovieResults(results), 'movie'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la découverte par genre' });
  }
});

export default router;
