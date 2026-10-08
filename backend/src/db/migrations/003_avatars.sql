-- Photo de profil : une image par utilisateur, redimensionnée côté navigateur (JPEG carré), stockée en base.
-- Pas de clé étrangère : cohérent avec les autres tables de suivi, et les comptes ne sont pas supprimés.
CREATE TABLE IF NOT EXISTS user_avatars (
  user_id INT PRIMARY KEY,
  mime_type VARCHAR(32) NOT NULL,
  data MEDIUMBLOB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
