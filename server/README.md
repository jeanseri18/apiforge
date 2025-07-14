# Serveur Proxy de Base de Données

Ce serveur proxy permet aux applications frontend de se connecter aux bases de données PostgreSQL et MySQL de manière sécurisée via une API REST.

## Installation

1. Naviguez vers le dossier du serveur :
```bash
cd server
```

2. Installez les dépendances :
```bash
npm install
```

## Démarrage

### Mode Production
```bash
npm start
```

### Mode Développement (avec rechargement automatique)
```bash
npm run dev
```

Le serveur démarrera sur le port 3001 par défaut.

## Configuration

Vous pouvez configurer le port via la variable d'environnement :
```bash
PORT=3002 npm start
```

## Endpoints API

### Health Check
- **GET** `/api/database/health`
- Vérifie que le serveur fonctionne

### Test de Connexion
- **POST** `/api/database/test-connection`
- Corps : Configuration de connexion à la base de données
- Retourne : `{ success: boolean }`

### Chargement des Tables
- **POST** `/api/database/load-tables`
- Corps : `{ connectionId: string, connection: DatabaseConnection }`
- Retourne : `{ tables: Table[] }`

### Exécution de Requête
- **POST** `/api/database/execute-query`
- Corps : `{ connectionId: string, connection: DatabaseConnection, query: string }`
- Retourne : Résultat de la requête avec données et métadonnées

## Sécurité

- Le serveur utilise CORS pour permettre les requêtes cross-origin
- Les connexions aux bases de données sont établies temporairement pour chaque requête
- Aucune donnée sensible n'est stockée en mémoire

## Dépendances

- **express** : Serveur web
- **cors** : Gestion CORS
- **pg** : Driver PostgreSQL
- **mysql2** : Driver MySQL
- **nodemon** : Rechargement automatique en développement

## Utilisation avec l'Application Frontend

1. Démarrez le serveur proxy
2. L'application frontend détectera automatiquement la disponibilité de l'API
3. Les connexions réelles aux bases de données seront routées via ce serveur
4. Si le serveur n'est pas disponible, l'application utilisera les données de démonstration

## Logs

Le serveur affiche des logs détaillés pour :
- Démarrage du serveur
- Requêtes API reçues
- Erreurs de connexion
- Erreurs d'exécution de requêtes

## Dépannage

### Le serveur ne démarre pas
- Vérifiez que le port 3001 n'est pas déjà utilisé
- Assurez-vous que toutes les dépendances sont installées

### Erreurs de connexion à la base de données
- Vérifiez les paramètres de connexion (host, port, credentials)
- Assurez-vous que la base de données est accessible depuis le serveur
- Vérifiez les règles de pare-feu

### L'application frontend ne détecte pas l'API
- Vérifiez que le serveur proxy fonctionne sur http://localhost:3001
- Testez l'endpoint health : `curl http://localhost:3001/api/database/health`
- Vérifiez la configuration CORS si vous utilisez un domaine différent