# Guide de Déploiement Granite ERP

Ce guide explique comment déployer l'application Granite ERP (Backend + Frontend + Base de données) en utilisant Docker. C'est la méthode la plus simple et la plus robuste.

## Prérequis

1.  **Docker Desktop** (ou Docker Engine sur Linux) doit être installé sur la machine où vous souhaitez déployer.

## Structure

Le déploiement utilise 3 conteneurs :
1.  **Postgres** : La base de données.
2.  **Backend** : L'API Node.js/Express.
3.  **Frontend** : L'interface React servie par Nginx.

## Installation et Lancement

1.  Assurez-vous d'être à la racine du dossier du projet (là où se trouve `docker-compose.yml`).

2.  Lancez la commande suivante pour construire et démarrer les services :
    ```bash
    docker-compose up -d --build
    ```

3.  Attendez quelques instants que les conteneurs se construisent et démarrent.

4.  **Initialisation de la Base de Données** :
    Une fois le backend démarré, vous devez appliquer les migrations Prisma pour créer les tables.
    ```bash
    # Exécuter la migration dans le conteneur backend
    docker-compose exec backend npx prisma migrate deploy
    ```

5.  C'est tout ! L'application est accessible à l'adresse :
    **http://localhost:8080**

## Commandes Utiles

-   **Arrêter les services** :
    ```bash
    docker-compose down
    ```

-   **Voir les logs** :
    ```bash
    docker-compose logs -f
    ```

-   **Redémarrer après une modification de code** :
    ```bash
    docker-compose up -d --build
    ```

## Déploiement sur un serveur (VPS)

Pour déployer sur un vrai serveur (AWS, DigitalOcean, OVH...) :
1.  Installez Docker et Docker Compose sur le serveur.
2.  Copiez tout le dossier du projet sur le serveur.
3.  Exécutez les mêmes commandes que ci-dessus.
4.  Pour exposer sur le port 80 (HTTP standard) au lieu de 8080, modifiez `docker-compose.yml` :
    ```yaml
    frontend:
      ports:
        - "80:80"
    ```
