import { Router } from 'express';
import pool from '../db/connection.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  COOKIE_OPTIONS,
  DUMMY_PASSWORD_HASH,
  PASSWORD_MAX_BYTES,
} from '../services/auth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { toTrimmedString } from '../utils/validation.js';

const router = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// 20 tentatives par IP toutes les 15 minutes, pour l'inscription comme pour la connexion.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Trop de tentatives. Réessaie dans quelques minutes.',
});

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Le mot de passe doit faire au moins 8 caractères.';
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    return `Le mot de passe est trop long (${PASSWORD_MAX_BYTES} octets maximum).`;
  }
  return null;
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password, display_name } = req.body;

    if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Le pseudo doit faire 3 à 20 caractères (lettres, chiffres, underscore uniquement).',
      });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const displayName = toTrimmedString(display_name, 64) || username;

    const [[existing]] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
    }

    const passwordHash = await hashPassword(password);
    let userId;
    try {
      const [result] = await pool.query(
        'INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)',
        [username, displayName, passwordHash]
      );
      userId = result.insertId;
    } catch (err) {
      // Deux inscriptions simultanées sur le même pseudo : la contrainte UNIQUE tranche.
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
      }
      throw err;
    }

    // Si c'est le tout premier compte, on lui rattache les données créées avant l'introduction
    // des comptes utilisateurs (historique importé), pour ne rien perdre.
    const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (Number(count) === 1) {
      for (const table of ['show_tracking', 'watch_status', 'movie_status', 'ratings', 'notes', 'watchlist']) {
        await pool.query(`UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`, [userId]);
      }
    }

    res.cookie('token', signToken(userId), COOKIE_OPTIONS);
    res.status(201).json({ id: userId, username, display_name: displayName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const invalid = () => res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return invalid();
    }

    const [[user]] = await pool.query(
      'SELECT id, username, display_name, password_hash FROM users WHERE username = ?',
      [username]
    );
    // Vérification dans tous les cas, pour que le temps de réponse ne révèle pas si le pseudo existe.
    const valid = await verifyPassword(password, user ? user.password_hash : DUMMY_PASSWORD_HASH);
    if (!user || !valid) return invalid();

    res.cookie('token', signToken(user.id), COOKIE_OPTIONS);
    res.json({ id: user.id, username: user.username, display_name: user.display_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: COOKIE_OPTIONS.secure });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, username, display_name, avatar_url FROM users WHERE id = ?',
      [req.userId]
    );
    if (!user) return res.status(401).json({ error: 'Non connecté' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { display_name, avatar_url } = req.body;
    const displayName = toTrimmedString(display_name, 64);
    if (!displayName) {
      return res.status(400).json({ error: "Le nom affiché doit faire entre 1 et 64 caractères." });
    }
    const avatar = typeof avatar_url === 'string' && avatar_url.trim() ? avatar_url.trim().slice(0, 255) : null;

    await pool.query('UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?', [
      displayName,
      avatar,
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

export default router;
