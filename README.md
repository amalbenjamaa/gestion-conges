# 🏢 Application de Gestion des Congés - DYNAMIX SERVICES

Application web complète pour la gestion des demandes de congés, développée avec **React** (frontend) et **PHP** (backend).

## 📋 Fonctionnalités

### Pour les Employés
- ✅ Création de demandes de congés
- ✅ Consultation de l'historique des demandes
- ✅ Suivi du solde de congés restant

### Pour les Managers/Admins
- ✅ Validation/Refus des demandes en attente
- ✅ Tableau de bord avec statistiques
- ✅ Suivi des collaborateurs (quotas, soldes)
- ✅ Graphiques d'évolution des congés

## 🛠️ Stack Technologique

### Frontend
- **React 19** avec Vite
- **Tailwind CSS v4** pour le design
- **Chart.js** pour les graphiques
- **React Router** pour la navigation

### Backend
- **PHP 8+** avec PDO
- **MySQL** (utf8mb4)
- API REST

## 📁 Structure du Projet

```
gestion-conges/
├── backend/
│   ├── config.ini          # Configuration DB (à créer)
│   ├── db.sql              # Schéma de la base de données
│   ├── public/
│   │   └── index.php      # Point d'entrée API
│   ├── scripts/
│   │   ├── create_admin.php
│   │   └── create_user.php
│   └── src/
│       ├── AuthController.php
│       ├── Database.php
│       ├── Helpers.php
│       └── RequestController.php
└── frontend/
    ├── src/
    │   ├── components/    # Composants réutilisables
    │   ├── pages/          # Pages de l'application
    │   ├── App.jsx         # Routes principales
    │   └── Login.jsx       # Page de connexion
    └── package.json
```

## 🚀 Installation

### Prérequis
- PHP >= 8.0
- MySQL
- Node.js >= 18.0
- npm ou yarn

Suivez les étapes 1 à 5 ci-dessous pour lancer l'application en local (backend + frontend).

### 1. Cloner le projet

```bash
git clone https://github.com/votre-compte/gestion-conges.git
cd gestion-conges
```

### 2. Configuration Backend

#### Base de données
```bash
# Importer le schéma SQL
mysql -u root -p < backend/db.sql
```

#### Configuration
Créer `backend/config.ini` :
```ini
[database]
DB_HOST = 127.0.0.1
DB_NAME = gestion_conges
DB_USER = root
DB_PASS = votre_mot_de_passe
DB_PORT = 3306
```

#### Créer un utilisateur manager
```bash
php backend/scripts/create_user.php
```
Sélectionner le rôle `2` pour manager (ou `1` pour employé).

### 3. Configuration Frontend

```bash
cd frontend
npm install
```

### 4. Lancer l'application

#### Terminal 1 - Backend
```bash
cd backend/public
php -S localhost:8000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### 5. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000

## 🔐 Authentification

L'application utilise une authentification basée sur email/mot de passe avec hashage sécurisé (`password_hash`).

### Rôles disponibles
- **employe** : Peut créer des demandes et consulter ses propres demandes
- **manager** : Accès complet + validation des demandes
- **admin** : Mêmes droits que manager (super-manager)

## 📡 API Endpoints

### Authentification
- `POST /api/login` - Connexion utilisateur

### Demandes
- `GET /api/requests` - Liste des demandes (filtres: `user_id`, `status`)
- `GET /api/requests/:id` - Détail d'une demande
- `POST /api/requests` - Créer une demande
- `PATCH /api/requests/:id/status` - Valider/Refuser une demande

### Statistiques
- `GET /api/stats` - Statistiques pour le dashboard

## 🧪 Tests

Pour tester l'application :

1. Créer un compte admin : `php backend/scripts/create_admin.php`
2. Se connecter avec les identifiants créés
3. Créer des demandes de congés
4. Valider/Refuser depuis la page Validation (manager/admin)

## 📝 Notes Importantes

- Le fichier `backend/config.ini` contient les identifiants de la base de données → **ne pas le commiter** (déjà dans `.gitignore`)
- Les mots de passe sont hashés avec `password_hash()` PHP
- L'API utilise CORS pour autoriser le frontend local

## 🔄 Prochaines Étapes

Voir `ETAT_PROJET.md` pour la liste complète des fonctionnalités à implémenter.

## 📄 Licence

Projet de stage - DYNAMIX SERVICES
