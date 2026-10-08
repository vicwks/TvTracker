import axios from 'axios';
import 'dotenv/config';

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
// Taille plus grande, pour les affiches affichées en plein écran (page de connexion).
export const IMAGE_BASE_URL_LARGE = 'https://image.tmdb.org/t/p/w780';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY, language: 'fr-FR' },
  // Sans délai maximum, une requête TMDB bloquée laisse la route en attente indéfiniment.
  timeout: 10000,
});

// Réessaie automatiquement en cas de limite de débit (429) ou d'erreur serveur (5xx),
// avec un backoff progressif. Utile pour les gros imports (centaines de séries).
tmdb.interceptors.response.use(null, async (error) => {
  const config = error.config;
  if (!config) return Promise.reject(error);
  config.__retryCount = config.__retryCount || 0;

  const status = error.response?.status;
  const shouldRetry = (status === 429 || (status >= 500 && status < 600)) && config.__retryCount < 5;

  if (!shouldRetry) return Promise.reject(error);

  config.__retryCount += 1;
  const retryAfterHeader = error.response?.headers?.['retry-after'];
  const waitMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : config.__retryCount * 1000;

  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return tmdb(config);
});

// Un identifiant TMDB inexistant renvoie 404 : les routes le traduisent en "introuvable".
export function isNotFoundError(err) {
  return err?.response?.status === 404;
}

export async function searchShows(query) {
  const { data } = await tmdb.get('/search/tv', { params: { query } });
  return data.results;
}

export async function searchMovies(query) {
  const { data } = await tmdb.get('/search/movie', { params: { query } });
  return data.results;
}

export async function getShowDetails(tmdbId) {
  const { data } = await tmdb.get(`/tv/${tmdbId}`);
  return data;
}

export async function getSeasonDetails(tmdbId, seasonNumber) {
  const { data } = await tmdb.get(`/tv/${tmdbId}/season/${seasonNumber}`);
  return data;
}

export async function getMovieDetails(tmdbId) {
  const { data } = await tmdb.get(`/movie/${tmdbId}`);
  return data;
}

export async function getTrendingShows(timeWindow = 'week') {
  const { data } = await tmdb.get(`/trending/tv/${timeWindow}`);
  return data.results;
}

export async function getTrendingMovies(timeWindow = 'week') {
  const { data } = await tmdb.get(`/trending/movie/${timeWindow}`);
  return data.results;
}

// Tendances toutes catégories confondues, triées par popularité : séries et films mêlés.
// "day" donne le vrai top du moment ; "week" serait plus stable.
export async function getTrendingAll(timeWindow = 'day') {
  const { data } = await tmdb.get(`/trending/all/${timeWindow}`);
  return data.results;
}

export async function getShowGenres() {
  const { data } = await tmdb.get('/genre/tv/list');
  return data.genres;
}

export async function getMovieGenres() {
  const { data } = await tmdb.get('/genre/movie/list');
  return data.genres;
}

export async function discoverShowsByGenre(genreId, page = 1) {
  const { data } = await tmdb.get('/discover/tv', {
    params: { with_genres: genreId, sort_by: 'popularity.desc', page },
  });
  return data.results;
}

export async function discoverMoviesByGenre(genreId, page = 1) {
  const { data } = await tmdb.get('/discover/movie', {
    params: { with_genres: genreId, sort_by: 'popularity.desc', page },
  });
  return data.results;
}

export default tmdb;
