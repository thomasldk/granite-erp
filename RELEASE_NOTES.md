# Granite ERP - Release V1.1.0

**Date :** 22 Décembre 2025
**Statut :** Production

## 🚀 Correctifs & Améliorations

### 1. Gestion Intelligente des Environnements
- **Détection Automatique** : Le serveur détecte s'il tourne localement ou sur Railway.
- **Support Proxy** : En local, le fichier `.env` est chargé automatiquement (avec support `dotenv-expand`).
- **Production Railway** : Sur Railway, le fichier `.env` est ignoré au profit des variables systèmes internes sécurisées.

### 2. Formulaires & UI
- **Correctif Tiers (Clients/Fournisseurs)** : Résolution du plantage lors du chargement des listes vides (Incoterms, etc.).
- **Diagnostic Visible** : Ajout d'une bannière d'erreur rouge explicite sur les formulaires pour faciliter le debug.
- **Refactoring** : Sécurisation du code avec des vérifications de types strictes (`Array.isArray`).

### 3. Base de Données
- **Nettoyage** : Vérification complète de la base de données.
- **Sécurisation de la Config** : La variable `DATABASE_URL` a été décomposée en variables unitaires (`DB_HOST`, `DB_USER`, etc.) pour plus de clarté.

---
# Granite ERP - Release V1.0.0
... (Keep existing V1.0 content)
