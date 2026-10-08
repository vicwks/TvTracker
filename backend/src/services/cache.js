// Cache mémoire à durée de vie limitée, pour les lectures TMDB répétitives
// (tendances, genres, recherches, détails de la watchlist).
// Il est réinitialisé au redémarrage du backend, ce qui est acceptable pour des données externes.

const MAX_ENTRIES = 500;
const store = new Map();

export async function cached(key, ttlMs, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  // En cas d'erreur, rien n'est mis en cache : le prochain appel réessaiera.
  const value = await loader();

  if (store.size >= MAX_ENTRIES) {
    // Les Map gardent l'ordre d'insertion : on supprime l'entrée la plus ancienne.
    store.delete(store.keys().next().value);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}
