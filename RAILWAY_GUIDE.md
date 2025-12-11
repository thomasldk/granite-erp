# Guide de Déploiement Granite ERP sur Railway

Ce guide explique comment déployer l'application sur Railway via GitHub.

## Étape 1 : Préparer le Projet pour GitHub

1.  **Initialiser Git** (si ce n'est pas déjà fait) :
    Ouvrez un terminal à la racine du projet (`granite-erp`) et lancez :
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  **Créer un Répertoire sur GitHub** :
    - Allez sur [GitHub.com](https://github.com) et créez un nouveau repository (e.g., `granite-erp`).
    - Ne cochez pas "Add README", "Add .gitignore".

3.  **Pousser le code** :
    Suivez les instructions de GitHub pour pousser votre code existant :
    ```bash
    git branch -M main
    git remote add origin https://github.com/VOTRE_USER/granite-erp.git
    git push -u origin main
    ```

## Étape 2 : Déployer le Backend sur Railway

1.  Allez sur [Railway.app](https://railway.app) et connectez-vous avec GitHub.
2.  Cliquez sur **"New Project"** > **"Deploy from GitHub repo"**.
3.  Sélectionnez votre repo `granite-erp`.
4.  **Configuration du Backend** :
    - Cliquez sur la carte du service ajouté.
    - Allez dans **Settings** > **Root Directory** et mettez `/backend`.
    - Allez dans **Variables** et ajoutez :
        - `PORT`: `3000` (ou laissez Railway gérer, mais assurez-vous que `server.ts` utilise `process.env.PORT`).
    - **Base de Données** :
        - Retournez sur la vue du projet (graph).
        - Faites clic-droit sur le vide ou cliquez sur "New" > **Database** > **PostgreSQL**.
        - Une fois la base créée, Railway injectera automatiquement la variable `DATABASE_URL` dans votre service backend.

5.  **Déploiement** : Railway va automatiquement redéployer. Vérifiez les logs.

6.  **Migrations** :
    - Une fois le backend déployé et "Healthy", allez dans l'onglet **Settings** du service backend.
    - Copiez la "Deploy Command" ou utilisez le terminal Railway (CLI) pour lancer les migrations.
    - *Astuce* : Vous pouvez ajouter une "Start Command" personnalisée ou une commande de build.
    - **Le mieux** : Ajoutez une "buid command" qui inclut la génération de prisma : `npm install && npx prisma generate && npm run build`.
    - Pour créer les tables la première fois, vous pouvez utiliser le CLI Railway localement ou ajouter une commande de "Deploy" : `npx prisma migrate deploy && npm start`.

## Étape 3 : Déployer le Frontend

1.  Dans le même projet Railway, cliquez sur **"New"** > **"GitHub Repo"** et sélectionnez **le même repo** `granite-erp`.
2.  Cliquez sur ce nouveau service.
3.  Allez dans **Settings** > **Root Directory** et mettez `/frontend`.
4.  Railway va détecter une app Vite/React.
5.  **Variables d'environnement** :
    - Le frontend a besoin de savoir où est le backend.
    - Ajoutez une variable `VITE_API_URL` avec l'URL publique de votre service Backend (que vous trouvez dans Backend > Settings > Networking > Generate Domain).

## Résumé

 Vous aurez 3 cases dans votre projet Railway :
 1. **PostgreSQL** (La base de données)
 2. **Backend** (L'API, connectée à la BDD via `DATABASE_URL`)
 3. **Frontend** (L'interface, connectée au Backend via `VITE_API_URL`)
