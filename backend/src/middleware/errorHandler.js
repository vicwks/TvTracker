// Gestion centralisée des erreurs HTTP : les réponses restent en JSON, sans détail interne.
// Les routes gèrent déjà leurs propres erreurs ; ce middleware couvre le reste (JSON malformé, route inconnue...).

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route introuvable' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corps de requête JSON invalide' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }
  console.error('Erreur non gérée :', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
