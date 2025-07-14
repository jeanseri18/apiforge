# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Ajouté

#### 🌐 Client API REST
- Interface moderne pour tester les APIs REST
- Support complet des méthodes HTTP (GET, POST, PUT, DELETE, PATCH, etc.)
- Gestion avancée des en-têtes, paramètres et corps de requête
- Authentification multiple (Basic Auth, Bearer Token, API Key, OAuth 2.0)
- Tests automatisés avec scripts JavaScript
- Validation SSL configurable

#### 📋 Gestion des Collections
- Création et organisation des requêtes en collections hiérarchiques
- Interface glisser-déposer pour réorganiser les éléments
- Import/Export de collections au format JSON
- Duplication et clonage de requêtes
- Recherche et filtrage dans les collections

#### 🗄️ Navigateur de Base de Données
- Support de MySQL 5.7+ et MySQL 8.0+
- Support de PostgreSQL 10+
- Explorateur de schémas avec visualisation des tables
- Éditeur SQL avec coloration syntaxique et autocomplétion
- Constructeur de requêtes visuel (Query Builder)
- Profileur de performances des requêtes
- Visualiseur de données avec pagination intelligente
- Historique complet des requêtes SQL
- Export de données (CSV, JSON, Excel)

#### 🔐 Gestionnaire de Tunnels SSH
- Connexions SSH sécurisées pour bases de données distantes
- Support des clés privées (RSA, ECDSA, Ed25519)
- Authentification par mot de passe avec chiffrement
- Générateur de clés SSH intégré
- Monitoring en temps réel des connexions
- Statistiques de transfert de données
- Test de connectivité et diagnostic réseau
- Gestion automatique des ports

#### 📝 Gestion de Projet
- Système de notes avec éditeur Markdown
- Support des diagrammes Mermaid
- Gestionnaire de tâches avec statuts multiples
- Organisation par priorités et dates d'échéance
- Interface Kanban pour la gestion visuelle
- Statistiques de progression en temps réel
- Système de tags et catégories
- Export de rapports (PDF, CSV)

#### 🔧 Environnements et Variables
- Gestion multi-environnements (Dev, Staging, Production)
- Variables d'environnement avec support des secrets
- Substitution automatique dans les requêtes
- Variables globales et locales
- Chiffrement des données sensibles

####  Historique et Analyse
- Historique complet des requêtes API et SQL
- Analyse des temps de réponse et performances
- Filtrage avancé par méthode, statut, date
- Vue détaillée des requêtes/réponses
- Export des données d'historique
- Graphiques de performance

#### ⚙️ Configuration et Personnalisation
- Thèmes clair/sombre/système
- Paramètres réseau configurables
- Éditeur de code personnalisable
- Notifications et alertes
- Raccourcis clavier configurables
- Interface responsive et redimensionnable

### Technique

#### 🛠️ Architecture
- Application Electron 28 pour le desktop
- Frontend React 18 avec TypeScript
- Styling avec Tailwind CSS
- Gestion d'état avec Zustand
- Routage avec React Router
- Build optimisé avec Vite

#### 📦 Dépendances Principales
- **UI/UX** : Lucide React, Heroicons, React Beautiful DnD
- **Base de données** : MySQL2, node-postgres (pg)
- **SSH** : SSH2, Node-SSH
- **Terminal** : XTerm.js avec addons
- **Markdown** : React Markdown, Remark GFM
- **Diagrammes** : Mermaid
- **Export** : jsPDF, html2canvas
- **HTTP** : Axios avec intercepteurs
- **Utilitaires** : Date-fns, UUID, clsx

#### 🔒 Sécurité
- Chiffrement AES-256 pour les données sensibles
- Stockage sécurisé des mots de passe et clés
- Validation SSL/TLS pour HTTPS
- Isolation des processus Electron
- Protection contre les injections SQL
- Sanitisation des entrées utilisateur

#### 🚀 Performances
- Lazy loading des composants
- Virtualisation des grandes listes
- Pool de connexions pour les bases de données
- Cache intelligent multi-niveaux
- Compression des données
- Code splitting pour un chargement rapide

### 📱 Plateformes Supportées
- Windows (x64, ia32)
- macOS (x64, arm64)
- Linux (x64)

### 🎯 Cas d'Usage
- Test et développement d'APIs REST
- Administration de bases de données
- Gestion de projets de développement
- Documentation technique
- Monitoring et debugging
- Prototypage rapide

---

## [Versions Futures]

### 🔮 Fonctionnalités Prévues

#### Version 1.1.0
- Support de GraphQL
- Intégration avec Git
- Collaboration en équipe
- Synchronisation cloud
- API de plugins

#### Version 1.2.0
- Support de MongoDB
- Éditeur de schémas visuels
- Tests de charge intégrés
- Monitoring en temps réel
- Intégration CI/CD

#### Version 1.3.0
- Support de Redis
- Générateur de documentation automatique
- Mocking avancé
- Webhooks et événements
- Marketplace de plugins

---

## Types de Changements

- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements dans les fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront supprimées
- `Supprimé` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` pour les vulnérabilités corrigées

---

**Note** : Ce changelog sera mis à jour à chaque nouvelle version avec les détails des changements apportés.