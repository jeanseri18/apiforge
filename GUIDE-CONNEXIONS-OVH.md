# Guide de Connexion aux Bases de Données OVH et Hébergeurs Externes

## Problèmes Courants et Solutions

### 1. Erreur ENOTFOUND (Résolution DNS)

**Symptôme :** `getaddrinfo ENOTFOUND nom-serveur.mysql.db`

**Causes possibles :**
- Nom d'hôte incorrect
- Problème de résolution DNS
- Serveur temporairement indisponible

**Solutions :**
1. **Vérifiez le nom d'hôte** dans votre panel OVH
2. **Testez la résolution DNS** :
   ```bash
   nslookup votre-serveur.mysql.db
   ping votre-serveur.mysql.db
   ```
3. **Utilisez l'IP directement** si le DNS ne fonctionne pas
4. **Changez de serveur DNS** (8.8.8.8, 1.1.1.1)

### 2. Configuration OVH MySQL

**Paramètres typiques OVH :**
- **Host :** `nom-serveur.mysql.db` (fourni par OVH)
- **Port :** `3306` (standard)
- **SSL :** Activé (recommandé)
- **Timeout :** 10-30 secondes

### 3. Améliorations Apportées

Le serveur backend a été amélioré avec :

#### Configuration DNS Optimisée
```javascript
dns: {
  family: 4, // Force IPv4
  hints: require('dns').ADDRCONFIG | require('dns').V4MAPPED,
}
```

#### Timeouts Augmentés
- `connectTimeout: 10000ms` (10 secondes)
- `acquireTimeout: 10000ms`
- `timeout: 10000ms`

#### Messages d'Erreur Explicites
- `ENOTFOUND` → Problème de résolution DNS
- `ECONNREFUSED` → Serveur inaccessible
- `ETIMEDOUT` → Timeout de connexion
- `ER_ACCESS_DENIED_ERROR` → Identifiants incorrects
- `ER_BAD_DB_ERROR` → Base de données introuvable

### 4. Checklist de Dépannage

#### Avant de Tester la Connexion
- [ ] Vérifiez les informations dans le panel OVH
- [ ] Confirmez que la base de données est active
- [ ] Vérifiez les autorisations d'accès distant
- [ ] Testez depuis un autre outil (phpMyAdmin, MySQL Workbench)

#### Paramètres de Connexion
- [ ] **Host :** Nom complet fourni par OVH
- [ ] **Port :** 3306 (sauf indication contraire)
- [ ] **Database :** Nom exact de la base
- [ ] **Username :** Utilisateur avec droits suffisants
- [ ] **Password :** Mot de passe correct
- [ ] **SSL :** Activé si supporté

#### Tests Réseau
```bash
# Test de résolution DNS
nslookup votre-serveur.mysql.db

# Test de connectivité
telnet votre-serveur.mysql.db 3306

# Test avec MySQL client
mysql -h votre-serveur.mysql.db -P 3306 -u username -p
```

### 5. Alternatives en Cas de Problème

#### Option 1 : Tunnel SSH
Si l'accès direct ne fonctionne pas, utilisez un tunnel SSH :
1. Configurez un tunnel SSH vers votre serveur
2. Connectez-vous via `localhost` sur le port tunnelé

#### Option 2 : VPN
Certains hébergeurs nécessitent une connexion VPN

#### Option 3 : Whitelist IP
Ajoutez votre IP publique dans les autorisations OVH

### 6. Monitoring et Logs

Le serveur backend affiche maintenant :
- 🔍 Tentatives de connexion
- ✅ Connexions réussies
- ❌ Erreurs détaillées avec codes

### 7. Support OVH

En cas de problème persistant :
1. Vérifiez le statut des services OVH
2. Consultez la documentation OVH MySQL
3. Contactez le support technique OVH
4. Fournissez les logs d'erreur détaillés

---

## Exemples de Configuration

### Configuration OVH Standard
```json
{
  "name": "Base OVH Production",
  "type": "mysql",
  "host": "mysql51-66.pro",
  "port": 3306,
  "database": "ma_base",
  "username": "ma_base",
  "password": "mot_de_passe_fort",
  "ssl": true
}
```

### Configuration avec IP Directe
```json
{
  "name": "Base OVH via IP",
  "type": "mysql",
  "host": "192.168.1.100",
  "port": 3306,
  "database": "ma_base",
  "username": "ma_base",
  "password": "mot_de_passe_fort",
  "ssl": false
}
```