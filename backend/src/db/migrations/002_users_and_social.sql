USE tv_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  display_name VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friendships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  addressee_id INT NOT NULL,
  status ENUM('pending','accepted') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_friendship (requester_id, addressee_id)
);

-- L'ajout de la colonne user_id sur les tables existantes (show_tracking, watch_status,
-- movie_status, ratings, notes, watchlist) et la mise à jour de leurs contraintes d'unicité
-- sont gérées par migrate.js : cela nécessite de la logique conditionnelle (rattachement des
-- données déjà existantes au premier compte créé), pas faisable proprement en SQL pur portable.
