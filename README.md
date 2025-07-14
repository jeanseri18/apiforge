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

### 🌐 Requêtes HTTP Complètes
- Support de tous les verbes HTTP (GET, POST, PUT, DELETE, PATCH)
- Gestion des paramètres, en-têtes et corps de requête
- Authentification (Basic Auth, Bearer Token, API Key, OAuth 2.0)
- Validation SSL configurable

### 🔧 Environnements et Variables
- Gestion multi-environnements (Dev, Staging, Production)
- Variables d'environnement avec support des secrets
- Substitution automatique dans les requêtes
- Interface de gestion intuitive

### 📊 Historique et Analyse
- Historique complet des requêtes exécutées
- Analyse des temps de réponse
- Filtrage et recherche dans l'historique
- Détails complets des requêtes/réponses

### ⚙️ Configuration Avancée
- Thèmes clair/sombre/système
- Paramètres réseau configurables
- Éditeur de code avec coloration syntaxique
- Notifications personnalisables

## 🛠️ Technologies

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron 28
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Icons**: Heroicons
- **Build**: Vite

## 📦 Installation

### Prérequis
- Node.js >= 18.0.0
- npm >= 8.0.0

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
│   ├── pages/             # Pages de l'application
│   ├── stores/            # Stores Zustand
│   ├── types/             # Types TypeScript
│   ├── App.tsx            # Composant principal
│   ├── main.tsx           # Point d'entrée React
│   └── router.tsx         # Configuration du routage
├── electron/              # Code Electron
│   ├── main.ts            # Processus principal Electron
│   ├── preload.ts         # Script de preload
│   └── tsconfig.json      # Config TypeScript pour Electron
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

### Collections
- Interface de gestion des collections et requêtes
- Éditeur de requêtes avec onglets (Paramètres, En-têtes, Corps, Auth, Tests)
- Exécution des requêtes avec affichage des réponses

### Environnements
- Gestion des environnements et variables
- Interface de création/modification des variables
- Support des variables secrètes

### Historique
- Liste chronologique des requêtes exécutées
- Filtrage par méthode HTTP et statut de réponse
- Vue détaillée des requêtes/réponses

### Paramètres
- Configuration de l'apparence (thèmes)
- Paramètres réseau et sécurité
- Configuration de l'éditeur
- Préférences de notifications

## 🔧 Configuration

### Variables d'environnement
L'application supporte les variables d'environnement suivantes :

- `NODE_ENV` - Environnement d'exécution (development/production)
- `VITE_APP_VERSION` - Version de l'application

### Paramètres utilisateur
Les paramètres sont automatiquement sauvegardés localement :

- Thème de l'interface
- Préférences réseau
- Configuration de l'éditeur
- Historique des requêtes

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
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Heroicons](https://heroicons.com/) pour les icônes
- [Zustand](https://github.com/pmndrs/zustand) pour la gestion d'état

---

**APIForge** - Développé avec ❤️ pour la communauté des développeurs