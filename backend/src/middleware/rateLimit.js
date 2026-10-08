// Limiteur de débit simple, en mémoire : au plus `max` requêtes par IP sur une fenêtre de `windowMs`.
// Sert à freiner les tentatives de connexion par force brute. Les compteurs sont réinitialisés au
// redémarrage du backend (suffisant pour une application personnelle).
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();

    // Nettoyage léger : on retire les fenêtres expirées quand la table grossit.
    if (hits.size > 10000) {
      for (const [key, entry] of hits) {
        if (entry.resetAt <= now) hits.delete(key);
      }
    }

    const key = req.ip;
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
