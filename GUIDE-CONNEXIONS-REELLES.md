# Guide des Connexions Réelles aux Bases de Données

Ce guide explique comment utiliser les connexions réelles aux bases de données PostgreSQL et MySQL avec l'application Crypto Database Tool.

## Architecture de la Solution

La solution utilise une architecture en deux parties :

1. **Frontend (React)** - Interface utilisateur sur le port 5173
2. **Serveur Proxy** - API backend sur le port 3001

```
[Frontend React] ←→ [Serveur Proxy] ←→ [Base de Données]
   Port 5173           Port 3001         PostgreSQL/MySQL
```

## Démarrage Rapide

### 1. Démarrer le Serveur Proxy

```bash
# Naviguer vers le dossier serveur
cd server

# Installer les dépendances (première fois seulement)
npm install

# Démarrer le serveur
npm run dev
```

Le serveur proxy démarrera sur http://localhost:3001

### 2. Démarrer l'Application Frontend

```bash
# Dans le dossier racine du projet
npm run dev
```

L'application démarrera sur http://localhost:5173

## Utilisation

### Connexions de Démonstration

- **Sans serveur proxy** : Utilise des données simulées
- **Avec serveur proxy** : Peut se connecter aux vraies bases de données

### Connexions Réelles

1. **Créer une nouvelle connexion** :
   - Cliquez sur "Nouvelle Connexion"
   - Sélectionnez le type (PostgreSQL ou MySQL)
   - Remplissez les paramètres de connexion
   - Testez la connexion

2. **Paramètres de connexion requis** :
   - **Host** : Adresse du serveur de base de données
   - **Port** : Port de la base de données (5432 pour PostgreSQL, 3306 pour MySQL)
   - **Database** : Nom de la base de données
   - **Username** : Nom d'utilisateur
   - **Password** : Mot de passe
   - **SSL** : Optionnel, pour les connexions sécurisées

### Fonctionnalités Disponibles

✅ **Test de connexion** - Vérification des paramètres
✅ **Chargement des tables** - Liste des tables et vues
✅ **Exploration des colonnes** - Structure des tables
✅ **Exécution de requêtes** - SQL SELECT, INSERT, UPDATE, DELETE
✅ **Historique des requêtes** - Suivi des exécutions

## Détection Automatique

L'application détecte automatiquement la disponibilité du serveur proxy :

- **🟢 Serveur proxy disponible** : Connexions réelles activées
- **🔴 Serveur proxy indisponible** : Mode démonstration uniquement

## Messages d'Information

### Connexions Réelles Disponibles
```
✅ Connexions réelles disponibles via le serveur proxy
```

### API Backend Requis
```
⚠️ API backend non disponible. Démarrez le serveur proxy pour les connexions réelles.
```

## Configuration Avancée

### Variables d'Environnement

Créez un fichier `.env` dans le dossier racine :

```env
# URL du serveur proxy (optionnel)
REACT_APP_API_URL=http://localhost:3001

# Port du serveur proxy (optionnel)
PORT=3001
```

### Sécurité

- Les connexions sont établies temporairement
- Aucun stockage permanent des credentials
- Communication chiffrée via HTTPS (en production)
- Validation des paramètres côté serveur

## Dépannage

### Problème : "API backend non disponible"

**Solution** :
1. Vérifiez que le serveur proxy fonctionne :
   ```bash
   curl http://localhost:3001/api/database/health
   ```
2. Redémarrez le serveur proxy si nécessaire

### Problème : "Erreur de connexion à la base de données"

**Solutions** :
1. Vérifiez les paramètres de connexion
2. Assurez-vous que la base de données est accessible
3. Vérifiez les règles de pare-feu
4. Testez la connexion directement :
   ```bash
   # PostgreSQL
   psql -h hostname -p 5432 -U username -d database
   
   # MySQL
   mysql -h hostname -P 3306 -u username -p database
   ```

### Problème : "Port déjà utilisé"

**Solution** :
```bash
# Changer le port du serveur proxy
PORT=3002 npm run dev

# Ou arrêter le processus utilisant le port
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Logs et Monitoring

### Logs du Serveur Proxy

Le serveur affiche des logs détaillés :
- Requêtes API reçues
- Connexions aux bases de données
- Erreurs et exceptions
- Performance des requêtes

### Logs du Frontend

Ouvrez la console du navigateur (F12) pour voir :
- Détection de l'API backend
- Erreurs de connexion
- Résultats des requêtes

## Exemples de Connexion

### PostgreSQL Local
```json
{
  "name": "PostgreSQL Local",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "myapp",
  "username": "postgres",
  "password": "password",
  "ssl": false
}
```

### MySQL Local
```json
{
  "name": "MySQL Local",
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "database": "myapp",
  "username": "root",
  "password": "password",
  "ssl": false
}
```

### PostgreSQL Cloud (Heroku, AWS RDS)
```json
{
  "name": "PostgreSQL Cloud",
  "type": "postgresql",
  "host": "ec2-xxx.compute-1.amazonaws.com",
  "port": 5432,
  "database": "d1234567890",
  "username": "username",
  "password": "password",
  "ssl": true
}
```

## Support

Pour obtenir de l'aide :
1. Consultez les logs des serveurs
2. Vérifiez la configuration réseau
3. Testez les connexions manuellement
4. Consultez la documentation des bases de données

---

**Note** : Cette solution permet des connexions réelles sécurisées tout en maintenant la compatibilité avec le mode démonstration pour les tests et le développement.