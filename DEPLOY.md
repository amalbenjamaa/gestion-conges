# Déploiement complet (Vercel + Railway)

L’utilisateur ouvre **un seul lien** : l’URL **Vercel** du frontend. Le backend reste sur une URL Railway séparée, mais le navigateur y accède automatiquement via la variable `VITE_API_URL`.

## 1. Base MySQL (Railway)

1. Crée un projet Railway → ajoute **MySQL**.
2. Onglet **Database → Data** (ou DBeaver / HeidiSQL) : exécute le script `backend/db.sql`.
3. Note les variables : `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`.

## 2. Backend PHP (Railway)

1. **New** → **GitHub Repo** → même repo que le frontend.
2. **Root Directory** : `backend`
3. **Start Command** :

   ```bash
   php -S 0.0.0.0:$PORT -t public
   ```

4. **Variables d’environnement** (service backend) :

| Variable | Valeur |
|----------|--------|
| `FRONTEND_URL` | `https://ton-app.vercel.app` (ton URL Vercel **sans** slash final) |
| `SESSION_CROSS_SITE` | `1` |
| `PUBLIC_BASE_URL` | `https://ton-backend.up.railway.app` (URL publique **HTTPS** du service, sans slash final) |
| *(optionnel)* `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | Si tu ne relies pas MySQL via « Reference » : copie depuis les variables MySQL Railway |

   **Recommandé** : dans Railway, utilise **Variables → Add Reference** pour injecter `MYSQLHOST`, `MYSQLPORT`, etc. dans le service PHP (le code lit aussi `MYSQL*`).

5. **Generate Domain** sur le service PHP pour obtenir l’URL HTTPS (ex. `https://gestion-conges-production-xxxx.up.railway.app`).

6. Test rapide dans le navigateur :  
   `https://TON-BACKEND.railway.app/api/login` → doit répondre du JSON (erreur de méthode ou message JSON), pas une page blanche.

> **Note** : les fichiers uploadés (`public/uploads`) sont sur le disque éphémère Railway : un redéploiement peut les effacer. Pour la prod, prévois plus tard un stockage objet (S3, etc.).

## 3. Frontend (Vercel)

1. **Root Directory** : `frontend`
2. Build : `npm run build` — Output : `dist`
3. **Environment Variables** :

   ```env
   VITE_API_URL=https://TON-BACKEND.up.railway.app
   ```

   (sans slash final, **https**)

4. Redéploie le projet Vercel après chaque changement de `VITE_API_URL`.

5. Fichier `vercel.json` à la racine de `frontend` (déjà recommandé pour React Router) :

   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```

## 4. Ordre des actions

1. Importer `db.sql` sur MySQL Railway  
2. Déployer le backend + variables + domaine public  
3. Mettre `VITE_API_URL` sur Vercel = URL du backend  
4. Redéployer Vercel  
5. Tester : ouvrir **uniquement** l’URL Vercel → connexion → navigation

## 5. Débogage rapide

- **CORS / 403 Origin** : vérifie `FRONTEND_URL` = exactement l’origine Vercel (`https://xxx.vercel.app`).
- **Login sans session** : vérifie `SESSION_CROSS_SITE=1` et que le site est en **HTTPS**.
- **Base de données** : logs Railway du service PHP ou message JSON « base de données indisponible ».
