import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db/connection.js';
import { importShowForUser } from '../src/services/importShow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pause entre chaque série pour rester correct vis-à-vis des limites de débit de TMDB.
const DELAY_BETWEEN_SHOWS_MS = 300;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Détermine le compte auquel rattacher l'import : soit --user=pseudo passé en argument,
// soit (s'il n'y a qu'un seul compte dans la base) ce compte-là automatiquement.
async function resolveTargetUser() {
  const userArg = process.argv.find((a) => a.startsWith('--user='));
  if (userArg) {
    const username = userArg.split('=')[1];
    const [[user]] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username]);
    if (!user) {
      console.error(`Aucun compte avec le pseudo "${username}".`);
      process.exit(1);
    }
    return user;
  }

  const [users] = await pool.query('SELECT id, username FROM users');
  if (users.length === 0) {
    console.error(
      "Aucun compte utilisateur trouvé. Crée d'abord ton compte via la page de connexion du site, puis relance cette commande."
    );
    process.exit(1);
  }
  if (users.length > 1) {
    console.error(
      `Plusieurs comptes existent (${users.map((u) => u.username).join(', ')}). ` +
        'Précise lequel avec : npm run import:tvtime -- --user=ton_pseudo'
    );
    process.exit(1);
  }
  return users[0];
}

async function main() {
  const payloadPath =
    process.argv.find((a) => !a.startsWith('--') && a.endsWith('.json')) ||
    path.join(__dirname, 'tvtime-payload.json');
  if (!fs.existsSync(payloadPath)) {
    console.error(`Fichier introuvable : ${payloadPath}`);
    process.exit(1);
  }

  const targetUser = await resolveTargetUser();
  console.log(`Import rattaché au compte : ${targetUser.username}\n`);

  const { shows } = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  console.log(`Import de ${shows.length} série(s) depuis ${payloadPath}...\n`);

  const report = [];
  for (let i = 0; i < shows.length; i++) {
    const item = shows[i];
    const result = await importShowForUser(targetUser.id, item, { defaultStatus: 'to_watch' });
    report.push(result);

    const label = `[${i + 1}/${shows.length}] ${item.title}`;
    if (result.status === 'importe') {
      const epInfo =
        result.episodes_demandes > 0 ? ` — ${result.episodes_marques}/${result.episodes_demandes} épisodes marqués` : '';
      console.log(`${label} → ✅ importé (${result.matched_title})${epInfo}`);
    } else if (result.status === 'non_trouve') {
      console.log(`${label} → ❌ introuvable sur TMDB`);
    } else {
      console.log(`${label} → ⚠️  erreur : ${result.message}`);
    }

    await sleep(DELAY_BETWEEN_SHOWS_MS);
  }

  const reportPath = path.join(__dirname, `import-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  const importedCount = report.filter((r) => r.status === 'importe').length;
  const notFoundCount = report.filter((r) => r.status === 'non_trouve').length;
  const errorCount = report.filter((r) => r.status === 'erreur').length;

  console.log('\n--- Résumé ---');
  console.log(`Importées avec succès : ${importedCount}`);
  console.log(`Introuvables sur TMDB : ${notFoundCount}`);
  console.log(`Erreurs                : ${errorCount}`);
  console.log(`Rapport détaillé écrit dans : ${reportPath}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Erreur fatale pendant l'import :", err);
  process.exit(1);
});
