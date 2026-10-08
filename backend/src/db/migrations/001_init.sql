CREATE DATABASE IF NOT EXISTS tv_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tv_tracker;

CREATE TABLE IF NOT EXISTS shows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  overview TEXT,
  poster_path VARCHAR(255),
  backdrop_path VARCHAR(255),
  first_air_date DATE NULL,
  genres VARCHAR(255),
  tmdb_status VARCHAR(50),
  vote_average FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT NOT NULL,
  tmdb_id INT,
  season_number INT NOT NULL,
  name VARCHAR(255),
  poster_path VARCHAR(255),
  air_date DATE NULL,
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_season (show_id, season_number)
);

CREATE TABLE IF NOT EXISTS episodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season_id INT NOT NULL,
  tmdb_id INT,
  episode_number INT NOT NULL,
  title VARCHAR(255),
  overview TEXT,
  air_date DATE NULL,
  runtime INT,
  still_path VARCHAR(255),
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_episode (season_id, episode_number)
);

CREATE TABLE IF NOT EXISTS show_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT NOT NULL UNIQUE,
  status ENUM('to_watch','watching','paused','completed','dropped') DEFAULT 'to_watch',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watch_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  episode_id INT NOT NULL UNIQUE,
  watched BOOLEAN DEFAULT FALSE,
  watched_at DATETIME NULL,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  overview TEXT,
  poster_path VARCHAR(255),
  backdrop_path VARCHAR(255),
  release_date DATE NULL,
  genres VARCHAR(255),
  runtime INT,
  vote_average FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL UNIQUE,
  watched BOOLEAN DEFAULT FALSE,
  watched_at DATETIME NULL,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('episode','season','show','movie') NOT NULL,
  target_id INT NOT NULL,
  rating DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_rating (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('episode','season','show','movie') NOT NULL,
  target_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('show','movie') NOT NULL,
  target_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_watchlist (target_type, target_id)
);
