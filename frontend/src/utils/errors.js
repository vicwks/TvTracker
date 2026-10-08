// Message à afficher à partir d'une erreur axios : le texte renvoyé par l'API, ou un repli lisible.
export function errorMessage(err, fallback) {
  if (!err.response) {
    return "Impossible de joindre le serveur. Vérifie que l'application est bien lancée.";
  }
  return err.response.data?.error || fallback;
}
