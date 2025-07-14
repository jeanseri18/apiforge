# APIForge

**Client API moderne et intuitif** - Une application desktop pour tester, documenter et gérer vos APIs REST.

![APIForge](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Electron](https://img.shields.io/badge/Electron-28.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)

## 🚀 Fonctionnalités

### 📋 Gestion des Collections
- Créez et organisez vos requêtes API en collections
- Interface intuitive pour gérer vos endpoints
- Import/Export de collections au format JSON
- Duplication et organisation des requêtes
- Arborescence hiérarchique des collections

### 🌐 Requêtes HTTP Complètes
- Support de tous les verbes HTTP (GET, POST, PUT, DELETE, PATCH)
- Gestion des paramètres, en-têtes et corps de requête
- Authentification (Basic Auth, Bearer Token, API Key, OAuth 2.0)
- Validation SSL configurable
- Tests automatisés des réponses

### 🗄️ Navigateur de Base de Données
- Connexions multiples aux bases de données (MySQL, PostgreSQL)
- Explorateur de schémas avec visualisation des tables
- Éditeur de requêtes SQL avec coloration syntaxique
- Constructeur de requêtes visuel (Query Builder)
- Profileur de performances des requêtes
- Historique des requêtes SQL exécutées
- Visualiseur de données avec pagination
- Diagnostic réseau pour les connexions

### 🔐 Tunnels SSH
- Gestionnaire de tunnels SSH intégré
- Connexions sécurisées aux bases de données distantes
- Support des clés privées et authentification par mot de passe
- Générateur de clés SSH
- Monitoring des connexions en temps réel
- Statistiques de transfert de données
- Test de connectivité SSH

### 📝 Gestion de Projet
- Système de notes intégré avec support Markdown
- Gestionnaire de tâches avec statuts (À faire, En cours, Terminé)
- Organisation par priorités et dates d'échéance
- Statistiques de progression des tâches
- Interface de glisser-déposer pour l'organisation

### 🔧 Environnements et Variables
- Gestion multi-environnements (Dev, Staging, Production)
- Variables d'environnement avec support des secrets
- Substitution automatique dans les requêtes
- Interface de gestion intuitive

###  Historique et Analyse
- Historique complet des requêtes exécutées
- Analyse des temps de réponse
- Filtrage et recherche dans l'historique
- Détails complets des requêtes/réponses
- Export des données d'historique

### ⚙️ Configuration Avancée
- Thèmes clair/sombre/système
- Paramètres réseau configurables
- Éditeur de code avec coloration syntaxique
- Notifications personnalisables
- Gestion des connexions avec pool de connexions

## 🛠️ Technologies

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Lucide React + Heroicons
- **Build**: Vite
- **Base de données**: MySQL2, PostgreSQL (pg)
- **SSH**: SSH2, Node-SSH
- **Terminal**: XTerm.js avec addons
- **Markdown**: React Markdown avec Remark GFM
- **Diagrammes**: Mermaid
- **Export**: jsPDF, html2canvas
- **Drag & Drop**: React Beautiful DnD
- **Coloration syntaxique**: React Syntax Highlighter
- **HTTP Client**: Axios
- **Utilitaires**: Date-fns, UUID, clsx

## 📦 Installation

### Prérequis
- Node.js >= 18.0.0
- npm >= 8.0.0
- Système d'exploitation: Windows, macOS, ou Linux
- Mémoire RAM: 4 GB minimum, 8 GB recommandé
- Espace disque: 500 MB pour l'installation

### Prérequis pour les fonctionnalités de base de données
- Accès réseau aux serveurs de base de données
- Permissions de connexion aux bases de données cibles
- Pour SSH: Accès SSH au serveur distant
- Ports disponibles pour les tunnels SSH (par défaut: 3000+)

### Installation des dépendances
```bash
npm install
```

## 🚀 Développement

### Démarrer en mode développement
```bash
# Démarrer l'application web
npm run dev

# Démarrer l'application Electron
npm run electron:dev
```

### Build de production
```bash
# Build web
npm run build

# Build Electron
npm run electron:build

# Créer les packages de distribution
npm run electron:dist
```

### Scripts disponibles

- `npm run dev` - Démarre le serveur de développement Vite
- `npm run build` - Build de production
- `npm run preview` - Prévisualise le build de production
- `npm run electron:dev` - Démarre l'application Electron en mode développement
- `npm run electron:build` - Compile le code Electron
- `npm run electron:serve` - Démarre l'application Electron compilée
- `npm run electron:pack` - Crée un package Electron
- `npm run electron:dist` - Crée les distributions pour toutes les plateformes
- `npm run lint` - Vérifie le code avec ESLint
- `npm run lint:fix` - Corrige automatiquement les erreurs ESLint
- `npm run type-check` - Vérifie les types TypeScript
- `npm run clean` - Nettoie les dossiers de build

## 📁 Structure du projet

```
apiforge/
├── src/                    # Code source React
│   ├── components/         # Composants réutilisables
│   │   ├── Database/       # Composants de base de données
│   │   │   ├── ConnectionModal.tsx
│   │   │   ├── DatabaseSidebar.tsx
│   │   │   ├── QueryEditor.tsx
│   │   │   ├── QueryBuilder.tsx
│   │   │   ├── QueryProfiler.tsx
│   │   │   ├── SchemaViewer.tsx
│   │   │   ├── DataViewer.tsx
│   │   │   ├── QueryHistory.tsx
│   │   │   └── NetworkDiagnostic.tsx
│   │   ├── notes/          # Système de notes
│   │   ├── todo/           # Gestionnaire de tâches
│   │   ├── shared/         # Composants partagés
│   │   ├── CollectionTree.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── ProjectManager.tsx
│   │   ├── RelationshipViewer.tsx
│   │   ├── ResizablePanel.tsx
│   │   ├── SSHTunnelManager.tsx
│   │   └── Sidebar.tsx
│   ├── pages/             # Pages de l'application
│   │   ├── Collections.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DatabaseBrowser.tsx
│   │   ├── Environments.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── services/          # Services métier
│   │   ├── connectionPool.ts
│   │   ├── databaseProxyService.ts
│   │   ├── databaseService.ts
│   │   ├── httpService.ts
│   │   ├── realDatabaseService.ts
│   │   └── sshService.ts
│   ├── stores/            # Stores Zustand
│   │   ├── appStore.ts
│   │   ├── collectionStore.ts
│   │   ├── databaseStore.ts
│   │   ├── environmentStore.ts
│   │   ├── historyStore.ts
│   │   ├── notesStore.ts
│   │   └── todoStore.ts
│   ├── types/             # Types TypeScript
│   │   ├── global.d.ts
│   │   └── index.ts
│   ├── App.tsx            # Composant principal
│   ├── main.tsx           # Point d'entrée React
│   └── router.tsx         # Configuration du routage
├── electron/              # Code Electron
│   ├── main.ts            # Processus principal Electron
│   ├── preload.ts         # Script de preload
│   └── tsconfig.json      # Config TypeScript pour Electron
├── server/                # Serveur proxy pour bases de données
│   ├── database-proxy.js
│   └── package.json
├── public/                # Assets statiques
├── dist/                  # Build web
├── dist-electron/         # Build Electron
├── release/               # Packages de distribution
└── package.json           # Configuration du projet
```

## 🎨 Interface utilisateur

### Dashboard
- Vue d'ensemble de vos collections et statistiques
- Actions rapides pour créer des collections et environnements
- Accès rapide aux collections récentes
- Statistiques de performance et d'utilisation

### Collections
- Interface de gestion des collections et requêtes
- Éditeur de requêtes avec onglets (Paramètres, En-têtes, Corps, Auth, Tests)
- Exécution des requêtes avec affichage des réponses
- Arborescence hiérarchique avec glisser-déposer
- Import/Export de collections

### Navigateur de Base de Données
- **Schema**: Explorateur de structure de base de données
- **Query**: Éditeur SQL avec autocomplétion et coloration syntaxique
- **Builder**: Constructeur visuel de requêtes
- **Profiler**: Analyse de performance des requêtes
- **History**: Historique des requêtes SQL exécutées
- Connexions multiples avec indicateurs de statut
- Visualiseur de données avec pagination

### Gestion de Projet
- **Notes**: Éditeur Markdown avec prévisualisation
- **Tâches**: Gestionnaire de tâches avec statuts et priorités
- Interface de glisser-déposer pour l'organisation
- Statistiques de progression en temps réel
- Système de tags et de catégories

### Tunnels SSH
- Gestionnaire de connexions SSH sécurisées
- Générateur de clés SSH intégré
- Monitoring en temps réel des connexions
- Test de connectivité et diagnostic réseau
- Statistiques de transfert de données

### Environnements
- Gestion des environnements et variables
- Interface de création/modification des variables
- Support des variables secrètes
- Substitution automatique dans les requêtes

### Historique
- Liste chronologique des requêtes exécutées
- Filtrage par méthode HTTP et statut de réponse
- Vue détaillée des requêtes/réponses
- Export des données d'historique
- Analyse des temps de réponse

### Paramètres
- Configuration de l'apparence (thèmes)
- Paramètres réseau et sécurité
- Configuration de l'éditeur
- Préférences de notifications
- Gestion des connexions de base de données

## 🔧 Configuration

### Variables d'environnement
L'application supporte les variables d'environnement suivantes :

- `NODE_ENV` - Environnement d'exécution (development/production)
- `VITE_APP_VERSION` - Version de l'application
- `DB_PROXY_PORT` - Port du serveur proxy de base de données (défaut: 3001)
- `SSH_KEY_PATH` - Chemin par défaut pour les clés SSH

### Paramètres utilisateur
Les paramètres sont automatiquement sauvegardés localement :

- Thème de l'interface
- Préférences réseau
- Configuration de l'éditeur
- Historique des requêtes
- Connexions de base de données (chiffrées)
- Tunnels SSH configurés
- Notes et tâches de projet

## 🔒 Sécurité

### Protection des données
- Chiffrement des mots de passe et clés privées
- Stockage sécurisé des informations de connexion
- Validation SSL/TLS pour les connexions HTTPS
- Isolation des processus Electron

### Bonnes pratiques
- Utilisez des variables d'environnement pour les données sensibles
- Configurez des tunnels SSH pour les connexions de base de données distantes
- Activez l'authentification à deux facteurs quand disponible
- Vérifiez les certificats SSL en production
- Utilisez des clés SSH plutôt que des mots de passe

### Audit et logs
- Historique complet des requêtes API et SQL
- Logs de connexion SSH avec horodatage
- Monitoring des performances en temps réel
- Export des données pour audit externe

## 📱 Plateformes supportées

- **Windows** (x64, ia32)
- **macOS** (x64, arm64)
- **Linux** (x64)

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Electron](https://electronjs.org/) pour le framework desktop
- [React](https://reactjs.org/) pour l'interface utilisateur
- [TypeScript](https://www.typescriptlang.org/) pour la sécurité des types
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Vite](https://vitejs.dev/) pour le build rapide
- [Zustand](https://github.com/pmndrs/zustand) pour la gestion d'état
- [Lucide React](https://lucide.dev/) et [Heroicons](https://heroicons.com/) pour les icônes
- [XTerm.js](https://xtermjs.org/) pour l'émulation de terminal
- [React Router](https://reactrouter.com/) pour la navigation
- [React Markdown](https://github.com/remarkjs/react-markdown) pour le rendu Markdown
- [Mermaid](https://mermaid.js.org/) pour les diagrammes
- [SSH2](https://github.com/mscdex/ssh2) pour les connexions SSH
- [MySQL2](https://github.com/sidorares/node-mysql2) et [node-postgres](https://node-postgres.com/) pour les bases de données
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) pour le glisser-déposer
- [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) pour la coloration syntaxique

---

## 📖 Documentation Complète

- **[Guide de Démarrage Rapide](GUIDE-DEMARRAGE-RAPIDE.md)** - Commencez rapidement avec APIForge
- **[Fonctionnalités Avancées](FONCTIONNALITES-AVANCEES.md)** - Documentation détaillée des fonctionnalités
- **[Changelog](CHANGELOG.md)** - Historique des versions et nouveautés
- **[Guides de Connexion](GUIDE-CONNEXIONS-OVH.md)** - Configuration des connexions spécialisées

---

**APIForge** - Développé avec ❤️ pour la communauté des développeurs