# Guide de Travail Sécurisé (Shared Database)

Ce projet utilise une base de données Railway **partagée** entre tous les développeurs.
**ATTENTION :** Toute modification de la base de données (reset, delete) impacte tous les collègues instantanément.

## Scripts Dangereux Sécurisés

Les scripts suivants ont été identifiés comme "dangereux" car ils suppriment des données. Ils ont été sécurisés et ne peuvent plus être lancés accidentellement.

### 1. `backend/debug_reset_db.ts`
*Ce script supprime toutes les soumissions, projets et items.*
- **Usage Sécurisé :**
  ```bash
  # Ne fonctionne pas (Erreur de sécurité)
  npx ts-node backend/debug_reset_db.ts
  
  # Fonctionne (AVEC PRÉCAUTION)
  FORCE_RESET=true npx ts-node backend/debug_reset_db.ts (Linux/Mac)
  set FORCE_RESET=true && npx ts-node backend/debug_reset_db.ts (Windows CMD)
  $env:FORCE_RESET="true"; npx ts-node backend/debug_reset_db.ts (PowerShell)
  ```

### 2. `backend/cleanup_non_maintenance.ts`
*Ce script nettoie tout sauf le module maintenance.*
- Requiert aussi `FORCE_RESET=true`.

### 3. `backend/migrate_data.ts`
*Ce script vide la base cible avant de migrer.*
- Requiert aussi `FORCE_RESET=true`.

## Bonnes Pratiques

1. **Ne jamais faire** `npx prisma migrate reset` sur la base partagée. Cela supprime toutes les tables.
2. Si vous devez modifier le schéma (ajout de colonne) :
   - Utilisez `npx prisma db push` (plutôt que migrate dev) si vous voulez éviter de créer des fichiers de migration qui pourraient confliter.
   - OU coordonnez-vous avec l'équipe pour une migration propre.
3. Pour tester des suppressions, commentez la ligne `DATABASE_URL` dans `.env` et pointez vers une base locale si possible, ou soyez extrêmement prudent.

---
*Document généré par l'assistant IA pour prévenir les pertes de données.*
