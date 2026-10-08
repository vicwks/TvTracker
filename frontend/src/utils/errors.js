// Message à afficher à partir d'une erreur axios : le texte renvoyé par l'API, ou un repli traduit.
// `unreachable` est le message à afficher quand le serveur ne répond pas du tout.
export function errorMessage(err, fallback, unreachable) {
  if (!err.response) {
    return unreachable;
  }
  return err.response.data?.error || fallback;
}
