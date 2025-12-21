---
description: Guide Complet - Workflow de Révision de Soumission & Mapping RAK
---

# Workflow de Révision de Soumission

Ce workflow décrit le processus technique pour créer une révision de soumission (C0R0 -> C0R1) en utilisant l'architecture hybride Mac (Backend) / PC Windows (Automate Excel).

## 1. Processus Global

1.  **Frontend**: L'utilisateur clique sur "Réviser" sur une soumission existante.
2.  **Backend (Mac)**:
    *   Crée une nouvelle Soumission en base de données (ex: `DRC25-0001-C0R1`).
    *   Copie toutes les données (Items, Client, Projet) de la soumission originale.
    *   Marque le statut comme `PENDING_REVISION`.
    *   Génère un fichier `.rak` (XML) dans `backend/pending_xml/` avec l'action `reviser`.
3.  **Agent (PC Windows)**:
    *   Détecte le fichier `.rak`.
    *   Lit l'action `reviser`.
    *   **Télécharge** le fichier Excel de la soumission *originale* depuis le Mac (via l'ID `quoteId` fourni dans le RAK).
    *   Dépose le fichier XML dans le dossier d'échange Lotus (`C:\Lotus\Domino\data\domino\html\erp\demo\echange`).
4.  **Automate (Excel/Lotus)**:
    *   Traite le fichier XML.
    *   Ouvre le fichier Excel original (Modele).
    *   Sauvegarde sous le nouveau nom (Cible).
    *   Génère un XML de retour confirmant le succès.
5.  **Agent (PC Windows)**:
    *   Récupère le XML de retour et le nouveau fichier Excel.
    *   Renvoie le tout au Backend (Mac).
6.  **Backend (Mac)**:
    *   Met à jour la soumission avec les données finales (prix recalculés par Excel).
    *   **Attente Stricte**: Copie le fichier Excel dans `Downloads` (+ délai sécurité 2s).
    *   **Finalisation**: SEULEMENT après la copie, passe le statut à `Draft` / `Synced` pour débloquer l'UI.
    *   *Note*: La durée de validité (`validityDuration`) est reprise de la soumission originale (ou défaut 30j si vide), garantissant qu'elle n'est jamais nulle.

## 2. Mapping RAK (XML de Révision)

Le fichier `.rak` généré par le service `XmlService.ts` doit respecter strictement ce mapping pour piloter l'automate.

### En-tête (Meta)
| Attribut XML | Valeur / Logique | Description |
| :--- | :--- | :--- |
| `action` | `'reviser'` | **Crucial**. Indique à l'automate de faire une révision. |
| `quoteId` | `OriginalQuote.id` | **Crucial**. Permet à l'Agent de télécharger le fichier source. |
| `cible` | `F:\nxerp\{Projet}\{NouveauFichier}.xlsx` | Chemin complet où le *nouveau* fichier sera créé sur le PC. |
| `modele` | `F:\nxerp\{Projet}\{NouveauFichier}.xlsx` | **Attention**: Pour une révision, le modèle est souvent indiqué comme la cible, mais l'automate utilise `ancienNom` pour trouver la source. |
| `ancienNom` | `{OriginalRef}_{Client}_{Projet}_{Mat}.xlsx` | Nom exact du fichier Excel de la soumission *précédente*. |
| `nouveauNom` | `{NouvelleRef}_{Client}_{Projet}_{Mat}.xlsx` | Nom exact du *nouveau* fichier Excel à créer. |
| `ancienCouleur` | `OriginalMaterial.name` | Nom du matériau de la soumission précédente. |
| `nouveauCouleur`| `OriginalMaterial.name` | Nom du matériau (souvent identique, sauf si changement). |
| `ancienQualite` | `OriginalMaterial.quality` | Qualité de la pierre précédente. |
| `nouvelleQualite`| `OriginalMaterial.quality` | Qualité de la pierre actuelle. |
| `definition` | `C:\Travail\XML\CLAUTOMATEREVISION.xml` | Fichier de définition local sur le PC. |

### Corps (Client / Devis)
Les autres champs (`<client>`, `<devis>`, `<pierre>`) suivent le mapping standard d'une soumission, en utilisant les données de la **nouvelle** soumission (celle qui est en cours de création).

*Note: Les chemins de fichiers doivent être au format Windows (Backslashes `\`).*
