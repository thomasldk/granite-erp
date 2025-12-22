# Granite ERP - Release V1.0.0

**Date :** 22 Décembre 2025
**Statut :** Production

## 🚀 Nouvelles Fonctionnalités

### 1. Architecture Tunnel Cloudflare (Mode Hybride)
- Connexion sécurisée et permanente via `https://erp.granitedrc.info`.
- Plus besoin de renouveler l'URL du tunnel "Quick Tunnel" temporaire.
- L'Agent Windows PC et le Serveur Mac communiquent de manière chiffrée.

### 2. Module de Mise en Production
- Possibilité pour les ventes de "Confirmer" une soumission "Émise".
- Génération automatique d'un **Bon de Travail (Work Order)**.
- Upload obligatoire du PO Client (PDF/Image) pour validation.
- Assignation des responsables (Projet et Comptabilité) côté client.
- Validation des champs obligatoires via une interface fluide (plus de popups bloquants).

### 3. Agent Windows Intelligent (V5.32)
- **Détection Automatique** : L'agent attend le retour du fichier PDF de l'automate.
- **Synchronisation Bidirectionnelle** : 
  - Mac -> PC : Envoi de l'Excel source.
  - PC -> Automate : Traitement Excel/PDF.
  - Automate -> PC -> Mac : Renvoi du PDF généré.
- **Mode Révision** : Support complet des révisions (CxRx) avec gestion intelligente des noms de fichiers.

### 4. Sauvegarde & Sécurité
- Scripts de sauvegarde complète (Base de données JSON + Code Source ZIP + Agent).
- Nettoyage du code : Archivage des scripts de debug (`backend/archive`).

## 🛠 Technique
- **Backend** : Node.js / Express / Prisma / PostgreSQL.
- **Frontend** : React / Vite / TailwindCSS.
- **Version** : 1.0.0 (Officielle).
