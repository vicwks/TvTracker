// Choisit le meilleur résultat de recherche TMDB pour un titre donné :
// 1) même année de première diffusion si on la connaît
// 2) sinon titre strictement identique (insensible à la casse)
// 3) sinon le premier résultat (le plus pertinent selon TMDB)
export function pickBestMatch(results, title, year) {
  if (results.length === 0) return null;
  if (year) {
    const byYear = results.find((r) => (r.first_air_date || '').startsWith(String(year)));
    if (byYear) return byYear;
  }
  const lowerTitle = String(title).toLowerCase();
  const exact = results.find((r) => (r.name || '').toLowerCase() === lowerTitle);
  if (exact) return exact;
  return results[0];
}
