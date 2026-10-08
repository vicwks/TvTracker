// Valeurs et contrôles partagés par les routes, les services et les scripts.

export const SHOW_STATUSES = ['to_watch', 'watching', 'paused', 'completed', 'dropped'];
export const TARGET_TYPES = ['show', 'movie'];

// TMDB est une base communautaire : une durée au-delà de 4h est une erreur de saisie.
export const MAX_PLAUSIBLE_RUNTIME = 240;

export function sanitizeRuntime(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MAX_PLAUSIBLE_RUNTIME) {
    return null;
  }
  return value;
}

// Entier strictement positif (identifiant), ou null si la valeur n'en est pas un.
export function toPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Note sur 10 (le frontend envoie 2, 4, 6, 8 ou 10 ; 0 n'est pas une note).
export function toRating(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
}

// Chaîne non vide, tronquée à la longueur maximale autorisée (null si ce n'est pas une chaîne).
export function toTrimmedString(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}
