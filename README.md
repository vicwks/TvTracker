# TV Tracker — suivi perso de séries & films

Application web (React + Node/Express + MySQL via WAMP + API TMDB) pour suivre tes séries et
films : statuts de visionnage, épisodes vus (avec revisionnage), notes, calendrier des sorties,
statistiques, comptes utilisateurs, amis, et page Découvrir (tendances TMDB + parcours par genre).

---

## Démarrage rapide avec Docker (recommandé)

Prérequis : Docker Desktop démarré, et un fichier `backend/.env` (modèle : `backend/.env.example`) avec `TMDB_API_KEY` et `JWT_SECRET`.

```bash
docker compose up -d --build
```

- Application : http://localhost:8080
- Documentation technique : http://localhost:8080/documentation
- MySQL (client externe) : `localhost:3307`, utilisateur `tvtracker`

Les migrations s'appliquent automatiquement au démarrage du backend. La suite de ce README décrit l'installation historique avec WAMP ; la documentation Docker complète est dans `documentation/docker.html`.

## Workflow Git

Trois branches permanentes :

| Branche | Rôle | Où elle tourne |
|---|---|---|
| `dev` | Développement. **Toujours partir de cette branche.** | PC local |
| `pre-prod` | Recette avant mise en production | Serveur externe (O2Switch), autre dossier |
| `main` | Production, branche principale du dépôt | Serveur externe (O2Switch), dossier de production |

Pour un développement :

1. Partir de `dev` à jour : `git switch dev` puis `git pull`.
2. Créer une branche `feat/<nom-du-developpement>` : `git switch -c feat/<nom-du-developpement>`.
3. Développer, committer, puis pousser la branche : `git push -u origin feat/<nom-du-developpement>`.
4. Fusionner dans `dev` une fois le travail validé. Les branches `pre-prod` et `main` ne reçoivent que des fusions venant de `dev`, jamais de développement direct.

La procédure est détaillée dans `documentation/maintenance.html`, section « Workflow Git ».

---

## 1. Prérequis

- **WAMP** démarré (icône verte) — fournit MySQL
- **Node.js** 18 ou plus récent (vérifier : `node -v` dans une invite de commande)
- Une clé API gratuite **TMDB** : https://www.themoviedb.org/settings/api

---

## 2. Installation (une seule fois)

### Backend

```bash
cd backend
npm install
copy .env.example .env
```

Ouvre `backend/.env` et renseigne :
- `DB_USER` / `DB_PASSWORD` : identifiants MySQL de WAMP (par défaut `root` et mot de passe vide)
- `TMDB_API_KEY` : ta clé TMDB
- `JWT_SECRET` : une longue chaîne aléatoire de ton choix (sert à signer les sessions de connexion)

Puis crée/mets à jour la base de données :

```bash
npm run migrate
```

(Cette commande est sans risque à relancer : elle ne supprime jamais tes données, elle ajoute
seulement ce qui manque.)

### Frontend

```bash
cd frontend
npm install
```

---

## 3. Lancer l'application (à chaque fois)

Deux terminaux, WAMP démarré **avant** :

**Terminal 1 — backend :**
```bash
cd backend
npm run dev
```
Attends de voir `Backend démarré sur http://localhost:5000`.

**Terminal 2 — frontend :**
```bash
cd frontend
npm run dev
```

Ouvre ensuite http://localhost:5173 dans ton navigateur.

---

## 4. Premier compte

Sur la page de connexion, clique sur "Créer un compte". **Le tout premier compte créé récupère
automatiquement toutes les données déjà présentes dans la base** (séries suivies, épisodes vus...)
d'avant l'introduction des comptes. Les comptes suivants démarrent avec un suivi vide.

---

## 5. Fonctionnalités principales

- **Dashboard** : séries en cours, stats rapides, prochains épisodes, recherche rapide parmi tes séries/films
- **Découvrir** : tendances TMDB et parcours par genre, avec pastilles d'amis qui regardent la même chose
- **Rechercher** : cherche sur TMDB ; clique sur une affiche pour voir la fiche complète, ou sur "+ Suivre" pour l'ajouter directement
- **Mes séries / Mes films** : onglets par statut (À voir / En cours / En pause / Terminées / Abandonnées), recherche locale
- **Fiche série** : saisons/épisodes, cases à cocher (avec proposition de rattraper les épisodes précédents), revisionnage (↻), notes en étoiles
- **Calendrier** : prochains épisodes de tes séries
- **Stats** : temps total (mois/jours/heures), répartition par genre, évolution mensuelle
- **Amis** : ajout par pseudo, demandes, liste d'amis

---

## 6. Import de tes données TV Time

Le script `backend/scripts/import-tvtime.js` importe les séries et les épisodes vus depuis un fichier
JSON : `backend/scripts/tvtime-payload.json`. Ce fichier est généré à partir de ton export RGPD TV Time
(`gdpr-data.zip`). **Il n'est pas présent dans le projet actuel** : il faut le régénérer avant de lancer l'import.

Le payload couvre environ 850 séries : une partie avec le détail épisode par épisode issu de ton historique
(épisodes marqués vus), le reste simplement suivi mais pas encore commencé (statut « à voir »).

```bash
cd backend
npm run import:tvtime
# ou, s'il y a plusieurs comptes :
npm run import:tvtime -- --user=ton_pseudo
```

Le script :
1. Cherche chaque série sur TMDB par titre (l'année, si elle est connue, lève les ambiguïtés).
2. Récupère et enregistre ses saisons et ses épisodes.
3. Marque les épisodes vus d'après ton historique.
4. Affiche la progression en direct.
5. Écrit un rapport `backend/scripts/import-report-<horodatage>.json` à la fin.

Durée estimée : **20 à 40 minutes**. Les erreurs de limitation TMDB (429) sont réessayées automatiquement, et une
erreur sur une série n'interrompt pas les suivantes. Les écritures utilisent `ON DUPLICATE KEY UPDATE` : relancer
le script est sans risque, même s'il a été interrompu.

**Après l'import** : dans le rapport, les séries `non_trouve` n'ont aucun résultat TMDB. Tu peux les rechercher
et les ajouter à la main depuis la page **Rechercher**.

Avec Docker, la base est exposée sur le port `3307` de ta machine, et non sur `3306` : vérifie la connexion
avant le premier import, le script lit ses paramètres depuis `backend/.env`.

---

## 7. Dépannage rapide

- **"Cannot find package ..."** au lancement du backend → `npm install` dans `backend/`
- **"La table ... n'existe pas"** / erreur sur Stats ou Dashboard → `npm run migrate` dans `backend/`
- **ECONNREFUSED** dans la console du frontend → le backend n'est pas démarré (ou a planté)
- **Le site ne charge rien** → vérifie que WAMP est bien vert avant de lancer le backend
- **Temps de visionnage bizarre** → page Stats : "🧹 Nettoyer les durées aberrantes" puis "⏱️ Corriger les durées manquantes".
  TMDB ne renseigne pas toujours la durée de chaque épisode (fréquent pour les animes et les séries coréennes) :
  sans repli, ces épisodes comptaient 0 minute. Une durée moyenne par série sert désormais de repli. Pour les séries
  importées avant ce correctif, lance une fois « Corriger les durées manquantes ».

---

## 8. Structure du projet

```
tv-tracker/
├── docker-compose.yml   Orchestration Docker (base, backend, frontend)
├── documentation/       Documentation technique, servie sur /documentation
├── backend/             API Node/Express, intégration TMDB, migrations MySQL
└── frontend/            Application React (Vite, Tailwind, Recharts)
```

Le schéma complet de la base est dans `backend/src/db/migrations/001_init.sql` et `002_users_and_social.sql`,
et les migrations sont dans `backend/src/db/migrate.js`.

## 9. Mettre à jour une installation existante

- **Avec Docker** : `docker compose up -d --build`. Les migrations s'appliquent au démarrage du backend.
- **Avec WAMP** : relance `npm run migrate` dans `backend/` si une modification de la base est signalée
  (la commande est sans risque : elle n'efface jamais tes données), puis redémarre le backend et le frontend.
