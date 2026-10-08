import cron from 'node-cron';
import pool from '../db/connection.js';
import { syncShowFromTmdb } from '../services/showSync.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let running = false;

// Resynchronise les séries suivies par au moins un utilisateur ("watching" ou "to_watch") pour
// récupérer les nouveaux épisodes et saisons. Une série en erreur n'interrompt pas les autres.
async function checkNewEpisodes() {
  if (running) {
    console.log('[cron] Vérification déjà en cours, exécution ignorée.');
    return;
  }
  running = true;
  console.log('[cron] Vérification des nouveaux épisodes...');

  try {
    const [shows] = await pool.query(
      `SELECT DISTINCT s.tmdb_id FROM shows s
       JOIN show_tracking st ON st.show_id = s.id
       WHERE st.status IN ('watching', 'to_watch')`
    );

    let failed = 0;
    for (const show of shows) {
      try {
        await syncShowFromTmdb(show.tmdb_id, { force: true });
      } catch (err) {
        failed++;
        console.error(`[cron] Série TMDB ${show.tmdb_id} ignorée :`, err.message);
      }
      await sleep(100);
    }
    console.log(`[cron] ${shows.length - failed}/${shows.length} série(s) vérifiée(s).`);
  } catch (err) {
    console.error('[cron] Erreur pendant la vérification :', err);
  } finally {
    running = false;
  }
}

// Tous les jours à 6h, heure de Paris (et non heure UTC du conteneur).
export function startEpisodeCheckCron() {
  cron.schedule('0 6 * * *', checkNewEpisodes, { timezone: 'Europe/Paris' });
  console.log('Cron de vérification des nouveaux épisodes programmé (tous les jours à 6h, heure de Paris).');
}
