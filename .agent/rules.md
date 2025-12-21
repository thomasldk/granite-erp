# User Rules & System Documentation

## 1. General Preferences
1. **Agent Display**: Toujours afficher le code complet de l'agent dans la conversation (ou via un artefact visible) lorsqu'il est modifiÃ© ou demandÃ©.
2. **Backups**: Toujours effectuer un backup avant des opérations critiques.
   - **Database**: `npx ts-node backend/backup_db.ts`
   - **Code**: Copie manuelle ou git commit.
3. **Database**: La base de données de production est **PostgreSQL (Railway)**.
    *   **Projet Railway** : `wholesome-enthusiasm` (Service `postgres`).
    *   **Host Proxy** : `maglev.proxy.rlwy.net` (Port visible dans le Dashboard User).
    *   **Important** : L'application DOIT être connectée à `maglev` pour être synchro avec la production.
4.  **Collaboration** : Partager la `DATABASE_URL` du `.env` de production avec les collaborateurs.
5.  **Data Source** : SQLite (`dev.db`) est **DEPRECATED**.

---

## 2. System Architecture (Hybrid Mode)
*   **Frontend (React/Vite)**: Code local exécuté sur Mac (`http://localhost:5173`).
*   **Backend (Node/Express)**: Code local exécuté sur Mac (`http://localhost:5006`).
*   **Database (PostgreSQL)**: Hébergée sur Railway (Cloud).
*   **Agent PC (Automate)**: Machine Windows qui exécute les macros Excel via des fichiers XML d'échange.
*   **Exchange Protocol**:
    *   Backend -> `pending_xml/` (.RAK files)
    *   Agent PC -> Polls `pending_xml/`, Execute Macro -> Generate Result -> `uploads/` or Network Share.

---

## 3. XML Mapping & Workflows
Le cœur du système repose sur la génération de fichiers XML (.rak) que l'automate Windows traite pour manipuler les fichiers Excel.

### A. Génération (Action: `emcot`)
Utilisé pour créer une nouvelle soumission Excel à partir du modèle par défaut.
*   **Logic**: `xmlService.generateQuoteXml`
*   **Déclencheur**: Bouton "Générer"
*   **Mapping XML**:
    *   `cible`: `F:\nxerp\{Projet}\{Reference}_{Client}_{Projet}_{Materiau}.xlsx`
    *   `modele`: `H:\Modeles\Directe\Modele de cotation defaut.xlsx`
    *   `definition`: `C:\Travail\XML\CLAUTOMATEEMISSIONCOTATION.xml`
    *   `action`: `emcot`

### B. Révision (Action: `reviser`)
Utilisé pour créer une révision (R0 -> R1) en dupliquant le fichier Excel source.
*   **Logic**: `quoteController.reviseQuote`
*   **Reference**: `C{x}R{y}` -> `C{x}R{y+1}`
*   **Mapping XML**:
    *   `cible`: `F:\nxerp\{Projet}\{NewRef}_{Client}_{Projet}_{Mat}.xlsx` (Nouveau Fichier)
    *   `modele`: `F:\nxerp\{Projet}\{OldRef}_{Client}_{Projet}_{Mat}.xlsx` (Fichier Source)
    *   `definition`: `C:\Travail\XML\CLAUTOMATEREVISION.xml`
    *   `action`: `reviser`
    *   **Attributs Spécifiques**:
        *   `ancienNom`: Reference Originale (ex: DRC25-0001-C0R0)
        *   `nouveauNom`: Nouvelle Reference (ex: DRC25-0001-C0R1)
        *   `ancienCouleur`: Nom Matériau Original
        *   `nouveauCouleur`: Nom Matériau Nouveau (si changé)
        *   `ancienQualite`: Qualité Originale (ex: A, B, S)
        *   `nouvelleQualite`: Qualité Nouvelle

### C. Copie / Duplication (Action: `recopier`)
Utilisé pour dupliquer une soumission pour un autre client ou option (C0 -> C1).
*   **Logic**: `quoteController.duplicateQuote`
*   **Reference**: `C{x}R{y}` -> `C{x+1}R0` (Nouvel index client, Reset Révision)
*   **Mapping XML**:
    *   `cible`: `F:\nxerp\{Projet}\{NewRef}_{NewClient}_{Projet}_{Mat}.xlsx`
    *   `modele`: `F:\nxerp\{Projet}\{OldRef}_{OldClient}_{Projet}_{Mat}.xlsx`
    *   `definition`: `C:\Travail\XML\CLAUTOMATERECOPIER.xml`
    *   `action`: `recopier`
    *   **Attributs Spécifiques**: Mêmes que Révision, mais appliqués au contexte de copie (nouveau client possible).

### D. Réintégration (Action: `reintegrer`)
Utilisé pour uploader un Excel modifié localement vers le serveur/automate.
*   **Logic**: `quoteController.reintegrateExcel`
*   **Mapping XML**:
    *   `cible`: `F:\nxerp\{Projet}\{Filename}` (Chemin final sur le PC)
    *   `modele`: `{UploadPath}` (Chemin temporaire ou identique)
    *   `definition`: `C:\Travail\XML\CLAUTOMATEREINTEGRER.xml`
    *   `action`: `reintegrer`
    *   `quoteId`: ID de la soumission pour le suivi.

---

## 4. Automation & Status Flow
1.  **Backend**: Génère .RAK -> Status `PENDING` / `PENDING_AGENT` / `PENDING_REVISION`.
2.  **Agent**:
    *   Lit .RAK dans `pending_xml/`.
    *   Exécute la macro Excel (VBA).
    *   Génère un XML de retour (Resultat).
    *   Déplace/Sauvegarde le fichier Excel final.
3.  **Backend**:
    *   Reçoit XML de retour (`importNetworkXml` ou polling).
    *   Met à jour les `QuoteItems` (Prix, Dimensions, etc.) depuis le XML.
    *   Met à jour le Status -> `Synced` ou `Calculated (Agent)`.
    *   Frontend détecte le status et débloque l'interface.

### 6. Critical Implementation Details (Do Not Regress)
> [!IMPORTANT]
> **Relational Data for XML Generation**:
> When performing **Duplicate ("Copier")** or **Revision ("Réviser")** actions, `prisma.quote.create` only returns scalar fields.
> You **MUST** perform a subsequent `prisma.quote.findUnique` including **ALL relations** (`client`, `project`, `material`, `items`, `contact`, `addresses`) *before* calling `xmlService`.
>
> **Why?** The XML generation relies on deep relation data (e.g., `client.name`, `material.name`) to construct filenames and content. Creating the XML directly from the `create` result will lead to "undefined" values in the filename and incomplete XML data.

### 7. Maintenance & Cleanup
- **Debug Scripts**: Located in `backend/` (e.g., `debug_verify_counts.ts`, `restore_full_json.ts`).
- **Logs**: Backend logs are critical for tracing "Agent" interactions. Use `console.log` generously in `quoteController.ts`.
*   **Database Reset**: Utiliser `prisma db push --force-reset` suivi de `ts-node prisma/seed.ts` pour remettre à zéro en cas de corruption majeure (ATTENTION: Perte de données).

### 8. FROZEN MODULES (STRICTLY READ-ONLY)
> The user has explicitly requested to **STOP all programming** on the "Project Module" (Backend `Project` model, Controllers, and Frontend Project Pages).
> **DO NOT MODIFY** any code related to Projects unless explicitly instructed to "Unfreeze" it.

### 9. Recent Implementations (Dec 2025)
- **Revision Persistence**:
  - Backend `reviseQuote` corrected to handle `paymentDays` vs `delayDays` mismatch.
  - Incoterm synchronization (ID vs String) fixed.
  - Commercial V8 fields (exchange rate, validity) fully persisted.
  - **Syntax Logic**: `if namespace` block cleaned up.
- **UI Enhancements**:
  - **Project Detail**: Displays Material Name and Purchase Price under the quote reference.
  - **Revision Modal**: Displays "(Achat: X $)" next to the unit price for context.
  - **State Management**: Revision Modal no longer resets values when polling updates occur (dependency fix).
