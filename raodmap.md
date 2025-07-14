# 🧪 APIForge

**Client moderne pour tester, documenter et automatiser des APIs REST, GraphQL et WebSockets**.  
Conçu pour les développeurs qui veulent un outil rapide, personnalisable, collaboratif et open-source.

---

## 🚀 Fonctionnalités principales

- 🔧 Création et exécution de requêtes HTTP (GET, POST, PUT, DELETE, PATCH)
- 🌐 Support REST, GraphQL & WebSocket
- 🧪 Tests automatisés avec assertions et chaining
- 🔐 Authentification avancée : OAuth 2.0, JWT, API Keys, Basic Auth
- 🗃️ Collections, environnements et variables
- 📜 Documentation automatique (OpenAPI)
- 👥 Collaboration d’équipe (workspaces, permissions)
- 📦 Import/Export Postman & Insomnia

---

## 🎯 Objectif

Créer une application **desktop et web**, légère et performante, pour faciliter le test d'API, le débogage et la collaboration autour des services web.

---

## 💡 Pourquoi APIForge ?

| Fonctionnalité | APIForge | Postman | Bruno |
|----------------|----------|---------|-------|
| Web + Desktop  | ✅       | ✅      | ✅    |
| Tests avancés  | ✅       | ✅      | ❌    |
| GraphQL Builder| ✅       | ✅      | ❌    |
| Collaboration  | ✅       | ✅      | ❌    |
| Open Source    | ✅       | ❌      | ✅    |

---

## 📦 Stack technique

### Frontend
- React + Vite (web)
- Electron (desktop)
- Zustand (state management)
- TailwindCSS

### Backend
- Node.js + Express
- PostgreSQL
- Redis (cache)
- JWT + OAuth 2.0

### Outils Dev
- GitHub Actions (CI/CD)
- Jest, Cypress, Newman
- Sentry, Mixpanel, Swagger

---

## 📌 MVP (Semaines 1–8)

- ✅ Requêtes HTTP avec authentification
- ✅ Collections et historique
- ✅ Variables d’environnement
- ✅ Interface utilisateur responsive
- ✅ Import Postman

---

## 🗺️ Roadmap

| Phase | Semaine | Objectif |
|-------|---------|----------|
| 1 | S1-S4 | Setup backend, base de données, auth |
| 2 | S5-S8 | Interface utilisateur + exécution de requêtes |
| 3 | S9-S12 | Fonctionnalités avancées (GraphQL, environnements) |
| 4 | S13-S16 | Scripts de tests, assertions, chaining |
| 5 | S17-S20 | Collaboration, export/import |
| 6 | S21-S24 | Optimisation, documentation, monitoring |

---

## 🧮 Modèle de données (extrait SQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id)
);

CREATE TABLE requests (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id),
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  headers JSONB,
  body TEXT
);
📂 Structure du projet
css
Copier
Modifier
project/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── stores/
│       └── utils/
├── backend/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── services/
└── shared/
    ├── types/
    └── constants/
🌐 API REST – Endpoints clés
Méthode	Route	Description
POST	/api/auth/login	Connexion utilisateur
GET	/api/collections	Liste des collections
POST	/api/requests	Exécution de requêtes
GET	/api/environments	Chargement des variables
GET	/api/history	Historique local
GET	/api/graphql/schema	Introspection GraphQL

✅ Objectifs finaux
⏱️ UI < 100ms de réponse

🔄 Execution < 5s (hors réseau)

📦 1000+ requêtes par collection

🛠️ Auto-doc en OpenAPI

🧪 Tests >90% de couverture

📚 Documentation
API : Swagger UI

Utilisateur : GitBook

Code : JSDoc / TypeDoc

🤝 Contribuer
Tu veux participer ? Forke le repo, fais une PR, ou ouvre une issue !

⚖️ Licence
MIT — open source & gratuit.

yaml
Copier
Modifier
