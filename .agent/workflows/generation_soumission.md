---
description: Guide Complet - Génération Soumission & Architecture Hybride Granite DRC
---

# Architecture & Principes Fondamentaux

> [!IMPORTANT]
> Ce projet fonctionne sur une **architecture HYBRIDE**. Le backend ne fait PAS les calculs finaux. Il délègue à un **Agent Windows** (Windows Automate).

## 1. Le Flux de Génération (The Flow)

1.  **Frontend** : L'utilisateur clique sur "Générer Excel" ou "Réviser".
2.  **Backend** :
    *   Le backend change le statut de la soumission à `PENDING_AGENT`.
    *   Il crée un fichier JSON/XML de demande dans un dossier surveillé (ou attente via API).
3.  **Agent PC (Windows)** :
    *   Un script externe (Windows Automate) détecte la demande.
    *   Il ouvre le **vrai Excel** (Template `Modele de cotation defaut.xlsx`).
    *   Il remplit les cases, exécute les macros VB pour les calculs de prix de pierre.
    *   Il génère un XML de *retour* contenant les prix finaux et les détails (Lignes générées).
4.  **Backend (Retour)** :
    *   Le backend (via `quoteController.ts` et `xmlService.ts`) surveille (poll) ou reçoit le XML de retour.
    *   Il parse ce XML pour mettre à jour la base de données (Prix, Quantités, Nouvelles Lignes).

## 2. Parsing XML (Règles CRITIQUES)

Les fichiers XML retournés par l'automate contiennent des abréviations que le système DOIT mapper correctement.
Géré dans `backend/src/services/xmlService.ts`.

| Champ XML (Source) | Champ DB (Destination) | Description |
| :--- | :--- | :--- |
| `No` ou `NL` | `lineNo` | Numéro de ligne visible dans le devis (ex: 1.1) |
| `Ref`, `REF`, `Reference` | `refReference` | La référence interne de la pièce |
| `Item`, `PDT`, `Produit`, `step` | `product` | Le nom du produit / étape |
| `TAG` | `tag` | L'étiquette principale |
| `Description` | `description` | Description complète |

> [!WARNING]
> Si ces colonnes (NL, REF, PDT) sont vides dans le tableau, c'est souvent parce que `xmlService.ts` ne cherche pas le bon attribut (Sensible à la casse parfois, d'où l'usage de `getAtt` case-insensitive).

## 3. Sauvegardes & Restauration (Backup)

*   **Service** : `backend/src/services/BackupService.ts`.
*   **Automatisme** : Activé dans `server.ts` via `backupService.startAutomatedBackup()`. Tourne toutes les heures.
*   **Emplacement** : `~/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes` ( sur le Mac hôte).
*   **Restauration** :
    *   Il existe un script `prisma/restore_full_json.ts` capable de lire un backup JSON et de tout réinjecter.
    *   Commande : `npx ts-node prisma/restore_full_json.ts` (Nécessite de placer le JSON cible en `restore_target.json`).

## 4. Environnement & Commandes Utiles

*   **Lancement** :
    *   Backend : `npm run dev` (Port 5006)
    *   Frontend : `npm run dev` (Port 5173 / 3000)
    *   Tunnel : `bash start_tunnel.sh` (Cloudflare)
*   **Base de Données** :
    *   PostgreSQL hébergé sur **Railway**.
    *   URL dans `backend/.env`.

---

**En cas de doute ou "d'amnésie" de l'IA :**
1.  Relire ce fichier.
2.  Vérifier `xmlService.ts` pour le parsing.
3.  Vérifier `server.ts` pour s'assurer que les crons de backup sont actifs.
