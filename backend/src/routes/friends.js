import { Router } from 'express';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { toPositiveInt } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Échappe les caractères joker de LIKE (% et _) pour qu'ils soient cherchés tels quels.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

// Recherche un utilisateur par pseudo ou nom affiché (pour lui envoyer une demande d'ami)
router.get('/search', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2 || q.length > 50) return res.json([]);

    const pattern = `%${escapeLike(q)}%`;
    const [users] = await pool.query(
      `SELECT id, username, display_name, avatar_url FROM users
       WHERE (username LIKE ? OR display_name LIKE ?) AND id != ?
       LIMIT 10`,
      [pattern, pattern, req.userId]
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Liste des amis acceptés
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url
       FROM friendships f
       JOIN users u ON u.id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
       WHERE f.status = 'accepted' AND (f.requester_id = ? OR f.addressee_id = ?)`,
      [req.userId, req.userId, req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des amis' });
  }
});

// Demandes reçues en attente
router.get('/requests', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.id AS friendship_id, u.id, u.username, u.display_name, u.avatar_url
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'pending'`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// Demandes envoyées, encore en attente
router.get('/sent', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.id AS friendship_id, u.id, u.username, u.display_name, u.avatar_url
       FROM friendships f
       JOIN users u ON u.id = f.addressee_id
       WHERE f.requester_id = ? AND f.status = 'pending'`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes envoyées' });
  }
});

// Envoie une demande d'ami par pseudo
router.post('/request', async (req, res) => {
  try {
    const { username } = req.body;
    if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: 'Pseudo invalide.' });
    }

    const [[target]] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (!target) return res.status(404).json({ error: 'Aucun utilisateur avec ce pseudo.' });
    if (target.id === req.userId) {
      return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même." });
    }

    const [[existing]] = await pool.query(
      `SELECT id, status FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
      [req.userId, target.id, target.id, req.userId]
    );
    if (existing) {
      return res.status(409).json({
        error: existing.status === 'accepted' ? 'Vous êtes déjà amis.' : 'Une demande est déjà en attente.',
      });
    }

    try {
      await pool.query('INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, ?)', [
        req.userId,
        target.id,
        'pending',
      ]);
    } catch (err) {
      // Demande envoyée deux fois en même temps : la contrainte UNIQUE tranche.
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Une demande est déjà en attente.' });
      }
      throw err;
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi de la demande" });
  }
});

// Accepte une demande reçue
router.post('/:friendshipId/accept', async (req, res) => {
  try {
    const friendshipId = toPositiveInt(req.params.friendshipId);
    if (!friendshipId) return res.status(404).json({ error: 'Demande introuvable' });

    const [result] = await pool.query(
      "UPDATE friendships SET status = 'accepted' WHERE id = ? AND addressee_id = ? AND status = 'pending'",
      [friendshipId, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Demande introuvable' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'acceptation" });
  }
});

// Refuse une demande reçue, ou supprime une amitié / demande envoyée
router.delete('/:friendshipId', async (req, res) => {
  try {
    const friendshipId = toPositiveInt(req.params.friendshipId);
    if (!friendshipId) return res.status(404).json({ error: 'Demande introuvable' });

    await pool.query('DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)', [
      friendshipId,
      req.userId,
      req.userId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
