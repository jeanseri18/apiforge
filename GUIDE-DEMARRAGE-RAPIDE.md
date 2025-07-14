# Guide de Démarrage Rapide - APIForge

Ce guide vous aidera à démarrer rapidement avec APIForge et à explorer ses principales fonctionnalités.

## 🚀 Installation et Premier Lancement

### 1. Installation

```bash
# Cloner le projet
git clone https://github.com/apiforge/apiforge.git
cd apiforge

# Installer les dépendances
npm install

# Démarrer en mode développement
npm run electron:dev
```

### 2. Premier Lancement

Au premier lancement, APIForge vous accueille avec :
- **Dashboard** : Vue d'ensemble de vos projets
- **Assistant de configuration** : Configuration initiale
- **Exemples intégrés** : Collections d'exemple pour commencer

## 📋 Créer votre Première Collection API

### Étape 1 : Nouvelle Collection
1. Cliquez sur **"Nouvelle Collection"** dans le dashboard
2. Donnez un nom à votre collection (ex: "Mon API")
3. Ajoutez une description (optionnel)
4. Cliquez sur **"Créer"**

### Étape 2 : Ajouter une Requête
1. Dans votre collection, cliquez sur **"+"** ou **"Nouvelle Requête"**
2. Configurez votre requête :
   - **Nom** : "Obtenir utilisateurs"
   - **Méthode** : GET
   - **URL** : `https://jsonplaceholder.typicode.com/users`
3. Cliquez sur **"Envoyer"**

### Étape 3 : Explorer la Réponse
- **Corps de la réponse** : Données JSON formatées
- **En-têtes** : Headers de la réponse
- **Statut** : Code de statut HTTP
- **Temps** : Durée de la requête

## 🌐 Configurer des Environnements

### Créer un Environnement
1. Allez dans **"Environnements"**
2. Cliquez sur **"Nouvel Environnement"**
3. Configurez :
   - **Nom** : "Développement"
   - **Variables** :
     - `base_url` = `https://api.dev.monsite.com`
     - `api_key` = `votre_clé_dev`

### Utiliser les Variables
Dans vos requêtes, utilisez `{{base_url}}/users` au lieu de l'URL complète.

## 🗄️ Connecter une Base de Données

### Configuration Simple (Local)
1. Allez dans **"Database Browser"**
2. Cliquez sur **"+"** pour ajouter une connexion
3. Configurez :
   - **Type** : MySQL ou PostgreSQL
   - **Host** : localhost
   - **Port** : 3306 (MySQL) ou 5432 (PostgreSQL)
   - **Database** : nom_de_votre_db
   - **Username/Password** : vos identifiants

### Configuration avec SSH (Serveur Distant)
1. Dans **"SSH Tunnels"**, créez un nouveau tunnel :
   - **Host SSH** : votre-serveur.com
   - **Username** : votre_user
   - **Port local** : 3307
   - **Port distant** : 3306
2. Connectez le tunnel
3. Dans Database Browser, utilisez :
   - **Host** : localhost
   - **Port** : 3307

## 📝 Gestion de Projet

### Notes Rapides
1. Allez dans **"Projet"** > **"Notes"**
2. Créez une nouvelle note
3. Utilisez Markdown pour formater :
   ```markdown
   # API Documentation
   
   ## Endpoints
   - GET /users - Liste des utilisateurs
   - POST /users - Créer un utilisateur
   
   ## TODO
   - [ ] Tester l'authentification
   - [x] Documenter les endpoints
   ```

### Tâches
1. Dans **"Projet"** > **"Tâches"**
2. Créez des tâches avec :
   - **Titre** : "Tester l'API de paiement"
   - **Priorité** : Haute
   - **Échéance** : Date limite
   - **Statut** : À faire

## 🔧 Conseils pour Bien Commencer

### Organisation des Collections
```
📁 Mon Projet API
├── 📁 Authentification
│   ├── 🔗 Login
│   ├── 🔗 Logout
│   └── 🔗 Refresh Token
├── 📁 Utilisateurs
│   ├── 🔗 Liste des utilisateurs
│   ├── 🔗 Créer utilisateur
│   └── 🔗 Modifier utilisateur
└── 📁 Commandes
    ├── 🔗 Liste des commandes
    └── 🔗 Détail commande
```

### Variables d'Environnement Recommandées
```json
{
  "base_url": "https://api.monsite.com",
  "api_version": "v1",
  "auth_token": "{{token}}",
  "timeout": "30000"
}
```

### Tests Automatisés
Dans l'onglet **"Tests"** de vos requêtes :
```javascript
// Vérifier le statut
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});

// Vérifier la structure
pm.test("Response has users array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('users');
});

// Sauvegarder une variable
const response = pm.response.json();
pm.environment.set("user_id", response.users[0].id);
```

## 🎯 Cas d'Usage Courants

### 1. Test d'API REST Complète
```
1. Créer une collection "E-commerce API"
2. Ajouter les environnements Dev/Staging/Prod
3. Créer les requêtes CRUD pour chaque ressource
4. Ajouter des tests automatisés
5. Documenter avec des notes
```

### 2. Développement avec Base de Données
```
1. Connecter la DB via SSH si nécessaire
2. Explorer le schéma dans Database Browser
3. Créer des requêtes SQL de test
4. Utiliser le Query Builder pour les requêtes complexes
5. Monitorer les performances avec le Profiler
```

### 3. Gestion de Projet API
```
1. Créer des notes pour la documentation
2. Lister les tâches de développement
3. Suivre les bugs et améliorations
4. Organiser les tests par priorité
5. Exporter les rapports de progression
```

## 🚨 Problèmes Courants et Solutions

### Connexion Base de Données Échoue
- ✅ Vérifiez les credentials
- ✅ Testez la connectivité réseau
- ✅ Vérifiez les permissions de la DB
- ✅ Utilisez un tunnel SSH si nécessaire

### Requêtes API Lentes
- ✅ Vérifiez la latence réseau
- ✅ Optimisez les paramètres de requête
- ✅ Utilisez le cache si disponible
- ✅ Analysez les logs de performance

### Variables Non Substituées
- ✅ Vérifiez la syntaxe `{{variable}}`
- ✅ Assurez-vous que l'environnement est sélectionné
- ✅ Vérifiez que la variable existe
- ✅ Rechargez l'environnement si nécessaire

## 📚 Ressources Utiles

### Documentation
- **README.md** : Documentation principale
- **FONCTIONNALITES-AVANCEES.md** : Fonctionnalités avancées
- **Aide intégrée** : Tooltips et guides contextuels

### Exemples
- **Collections d'exemple** : Disponibles au premier lancement
- **Templates** : Modèles de requêtes courantes
- **Snippets** : Extraits de code pour les tests

### Support
- **Issues GitHub** : Rapporter des bugs
- **Discussions** : Questions et suggestions
- **Wiki** : Documentation communautaire

---

🎉 **Félicitations !** Vous êtes maintenant prêt à utiliser APIForge efficacement. N'hésitez pas à explorer toutes les fonctionnalités et à personnaliser l'outil selon vos besoins.