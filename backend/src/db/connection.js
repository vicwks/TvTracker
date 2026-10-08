import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tv_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  // Maintient les connexions ouvertes : évite de payer une reconnexion à chaque pic de requêtes
  enableKeepAlive: true,
  dateStrings: true,
  decimalNumbers: true, // évite que SUM()/AVG() ne soient renvoyés en texte (source de bugs d'addition)
});

// Sans ce gestionnaire, une coupure de connexion à MySQL (conteneur qui redémarre, base
// momentanément indisponible...) ferait planter tout le process Node au lieu de simplement
// faire échouer la requête en cours.
pool.on('error', (err) => {
  console.error('Erreur de connexion MySQL (non fatale, la prochaine requête réessaiera) :', err.message);
});

export default pool;
