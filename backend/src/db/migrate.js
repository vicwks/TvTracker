import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSqlFile(connection, filename) {
  const sqlPath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await connection.query(sql);
}

// Ajoute une colonne si elle n'existe pas déjà (portable MySQL/MariaDB, sans dépendre
// de la syntaxe "ADD COLUMN IF NOT EXISTS" qui n'est pas supportée partout).
async function addColumnIfMissing(connection, table, columnDef) {
  const columnName = columnDef.trim().split(/\s+/)[0];
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
    console.log(`Colonne "${columnName}" ajoutée à la table ${table}.`);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }
}

// Ajoute un index simple si absent. Sert à garder une clé étrangère valide quand on retire
// l'index unique qui la couvrait (MySQL refuse sinon : "needed in a foreign key constraint").
async function addIndexIfMissing(connection, table, keyName, columns) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD INDEX ${keyName} (${columns})`);
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err;
  }
}

async function dropKeyIfExists(connection, table, keyName) {
  try {
    await connection.query(`ALTER TABLE ${table} DROP INDEX ${keyName}`);
  } catch (err) {
    if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') throw err;
  }
}

async function addUniqueIfMissing(connection, table, keyName, columns) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD UNIQUE KEY ${keyName} (${columns})`);
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err;
  }
}

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Exécution de la migration...');
  await runSqlFile(connection, '001_init.sql');

  // --- Ajouts accumulés lors des mises à jour précédentes (idempotents) ---
  try {
    await connection.query('ALTER TABLE shows ADD COLUMN episode_runtime INT NULL');
    console.log('Colonne "episode_runtime" ajoutée à la table shows.');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }

  await connection.query(
    "ALTER TABLE show_tracking MODIFY COLUMN status ENUM('to_watch','watching','paused','completed','dropped') DEFAULT 'to_watch'"
  );

  // --- Comptes utilisateurs + amitiés ---
  await runSqlFile(connection, '002_users_and_social.sql');

  // --- Photos de profil (table dédiée, une ligne par utilisateur) ---
  await runSqlFile(connection, '003_avatars.sql');

  // --- Passage des tables "par série/épisode" à un modèle "par utilisateur" ---
  await addColumnIfMissing(connection, 'show_tracking', 'user_id INT NULL');
  await addColumnIfMissing(connection, 'watch_status', 'user_id INT NULL');
  await addColumnIfMissing(connection, 'movie_status', 'user_id INT NULL');
  await addColumnIfMissing(connection, 'ratings', 'user_id INT NULL');
  await addColumnIfMissing(connection, 'notes', 'user_id INT NULL');
  await addColumnIfMissing(connection, 'watchlist', 'user_id INT NULL');

  await addIndexIfMissing(connection, 'show_tracking', 'idx_show_id', 'show_id');
  await dropKeyIfExists(connection, 'show_tracking', 'show_id');
  await addUniqueIfMissing(connection, 'show_tracking', 'uniq_user_show', 'user_id, show_id');

  await addIndexIfMissing(connection, 'watch_status', 'idx_episode_id', 'episode_id');
  await dropKeyIfExists(connection, 'watch_status', 'episode_id');
  await addUniqueIfMissing(connection, 'watch_status', 'uniq_user_episode', 'user_id, episode_id');

  await addIndexIfMissing(connection, 'movie_status', 'idx_movie_id', 'movie_id');
  await dropKeyIfExists(connection, 'movie_status', 'movie_id');
  await addUniqueIfMissing(connection, 'movie_status', 'uniq_user_movie', 'user_id, movie_id');

  await dropKeyIfExists(connection, 'ratings', 'uniq_rating');
  await addUniqueIfMissing(connection, 'ratings', 'uniq_user_rating', 'user_id, target_type, target_id');

  await addUniqueIfMissing(connection, 'notes', 'uniq_user_note', 'user_id, target_type, target_id');

  await dropKeyIfExists(connection, 'watchlist', 'uniq_watchlist');
  await addUniqueIfMissing(connection, 'watchlist', 'uniq_user_watchlist', 'user_id, target_type, target_id');

  // --- Nettoyage des saisons "Spéciaux" (saison 0 côté TMDB) ---
  const [specialSeasons] = await connection.query('SELECT id FROM seasons WHERE season_number = 0');
  if (specialSeasons.length > 0) {
    const [specialEpisodes] = await connection.query(
      `SELECT id FROM episodes WHERE season_id IN (${specialSeasons.map(() => '?').join(',')})`,
      specialSeasons.map((s) => s.id)
    );
    if (specialEpisodes.length > 0) {
      const epIds = specialEpisodes.map((e) => e.id);
      const placeholders = epIds.map(() => '?').join(',');
      await connection.query(
        `DELETE FROM ratings WHERE target_type = 'episode' AND target_id IN (${placeholders})`,
        epIds
      );
      await connection.query(
        `DELETE FROM notes WHERE target_type = 'episode' AND target_id IN (${placeholders})`,
        epIds
      );
    }
    await connection.query('DELETE FROM seasons WHERE season_number = 0');
    console.log(
      `${specialSeasons.length} saison(s) "Spéciaux" et ${specialEpisodes.length} épisode(s) associé(s) supprimé(s).`
    );
  }

  // --- Suivi des rewatchs (combien de fois un épisode a été revu) ---
  await addColumnIfMissing(connection, 'watch_status', 'watch_count INT NOT NULL DEFAULT 0');
  // Les épisodes déjà marqués vus avant l'introduction de cette colonne repartent à 1
  // (une "première vision" connue), plutôt que 0 qui donnerait l'impression de rien avoir vu.
  await connection.query('UPDATE watch_status SET watch_count = 1 WHERE watched = TRUE AND watch_count = 0');

  // --- Date de dernière synchronisation TMDB (évite de rappeler TMDB à chaque aperçu) ---
  await addColumnIfMissing(connection, 'shows', 'synced_at DATETIME NULL');

  // --- Adresse email des comptes (obligatoire à l'inscription, vide pour les comptes d'avant).
  // La contrainte UNIQUE accepte plusieurs NULL, donc les anciens comptes ne posent pas de problème.
  // 190 caractères : un index UNIQUE en utf8mb4 ne peut pas dépasser 1000 octets (190 x 4 = 760).
  await addColumnIfMissing(connection, 'users', 'email VARCHAR(190) NULL');
  await addUniqueIfMissing(connection, 'users', 'uniq_user_email', 'email');

  // --- Index pour les requêtes fréquentes : calendrier, statistiques, listes ---
  await addIndexIfMissing(connection, 'episodes', 'idx_episode_air_date', 'air_date');
  await addIndexIfMissing(connection, 'show_tracking', 'idx_tracking_user_status', 'user_id, status');
  await addIndexIfMissing(connection, 'watch_status', 'idx_watch_user_watched', 'user_id, watched, watched_at');
  await addIndexIfMissing(connection, 'movie_status', 'idx_movie_user_watched', 'user_id, watched');

  console.log('Migration terminée : la base "tv_tracker" et ses tables sont prêtes.');

  await connection.end();
}

migrate().catch((err) => {
  console.error('Erreur pendant la migration :', err);
  process.exit(1);
});
