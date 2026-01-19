# 📘 Guide Complet - Construction de l'Application Gestion des Congés

Ce document détaille **toutes les étapes** pour construire l'application depuis zéro jusqu'à son état actuel, comme si vous l'aviez développée vous-même.

---

## 🎯 Vue d'ensemble du Projet

**Stack Technologique :**
- **Frontend** : React 19 + Vite + Tailwind CSS v4 + Chart.js
- **Backend** : PHP 8+ avec PDO (MySQL)
- **Base de données** : MySQL (utf8mb4)

**Structure du projet :**
```
gestion-conges/
├── backend/
│   ├── config.ini
│   ├── db.sql
│   ├── public/
│   │   └── index.php
│   ├── scripts/
│   │   └── create_admin.php
│   └── src/
│       ├── Database.php
│       ├── Helpers.php
│       └── RequestController.php
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── ...
    ├── package.json
    └── tailwind.config.js
```

---

## 📋 ÉTAPE 0 : PRÉREQUIS (Windows PowerShell)

### 1. Vérifier les outils installés

```powershell
# Vérifier PHP
php --version  # Doit être >= 8.0

# Vérifier Node.js
node --version  # Doit être >= 18.0

# Vérifier npm
npm --version

# Vérifier MySQL
mysql --version  # Ou via XAMPP/WAMP
```

### 2. Installer les dépendances si manquantes

- **PHP** : Télécharger depuis php.net ou installer via XAMPP/WAMP
- **Node.js** : Télécharger depuis nodejs.org
- **MySQL** : Installer MySQL ou utiliser XAMPP/WAMP

---

## 📋 ÉTAPE 1 : INITIALISATION DU PROJET

### 1.1 Créer la structure des dossiers

```powershell
# Créer le dossier principal
mkdir gestion-conges
cd gestion-conges

# Créer la structure backend
mkdir backend
mkdir backend\public
mkdir backend\scripts
mkdir backend\src

# Créer la structure frontend
mkdir frontend
cd frontend
```

### 1.2 Initialiser le projet React avec Vite

```powershell
# Dans le dossier frontend
npm create vite@latest . -- --template react
```

Répondre aux questions :
- Project name: `frontend`
- Framework: `React`
- Variant: `JavaScript`

### 1.3 Installer les dépendances frontend

```powershell
npm install
```

### 1.4 Installer les dépendances supplémentaires

```powershell
# React Router pour la navigation
npm install react-router-dom

# Chart.js pour les graphiques
npm install chart.js react-chartjs-2

# Tailwind CSS v4
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
```

---

## 📋 ÉTAPE 2 : CONFIGURATION FRONTEND

### 2.1 Configurer Tailwind CSS

Créer `postcss.config.js` :
```javascript
export default {
  plugins: {
    autoprefixer: {},
  },
}
```

Modifier `vite.config.js` :
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

Créer `tailwind.config.js` :
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Modifier `src/index.css` :
```css
@import "tailwindcss";

:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: #f9fafb;
  color: #1f2937;
}

#root {
  min-height: 100vh;
}
```

### 2.2 Configurer React Router

Modifier `src/main.jsx` :
```javascript
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 📋 ÉTAPE 3 : BASE DE DONNÉES

### 3.1 Créer la base de données

Créer `backend/db.sql` avec le schéma complet :

```sql
-- Création de la base et des tables
CREATE DATABASE IF NOT EXISTS `gestion_conges` 
DEFAULT CHARACTER SET = 'utf8mb4' 
DEFAULT COLLATE = 'utf8mb4_general_ci';

USE `gestion_conges`;

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE, 
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_complet VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NULL,
  role_id INT NOT NULL DEFAULT 1,
  avatar_url VARCHAR(512) NULL,
  solde_total INT DEFAULT 0,
  solde_consomme INT DEFAULT 0,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  CONSTRAINT fk_utilisateurs_roles FOREIGN KEY (role_id) 
    REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Types de congés
CREATE TABLE IF NOT EXISTS types_conges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  piece_jointe_requise TINYINT(1) NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT '#3b82f6',
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pièces jointes
CREATE TABLE IF NOT EXISTS pieces_jointes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_fichier VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(1024) NOT NULL,
  type_mime VARCHAR(100) NULL,
  taille INT NULL,
  telecharge_par INT NULL,
  telecharge_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pieces_utilisateurs FOREIGN KEY (telecharge_par) 
    REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table principale des demandes
CREATE TABLE IF NOT EXISTS demandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  type_id INT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nb_jours INT NOT NULL,
  motif TEXT NULL,
  piece_jointe_id INT NULL,
  statut ENUM('en_attente','validee','refusee','annulee') DEFAULT 'en_attente',
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  traite_par INT NULL,
  date_traitement TIMESTAMP NULL,
  commentaire_traitement TEXT NULL,
  CONSTRAINT fk_demandes_utilisateur FOREIGN KEY (utilisateur_id) 
    REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_demandes_type FOREIGN KEY (type_id) 
    REFERENCES types_conges(id) ON DELETE RESTRICT,
  CONSTRAINT fk_demandes_piece FOREIGN KEY (piece_jointe_id) 
    REFERENCES pieces_jointes(id) ON DELETE SET NULL,
  CONSTRAINT fk_demandes_traite_par FOREIGN KEY (traite_par) 
    REFERENCES utilisateurs(id) ON DELETE SET NULL,
  INDEX (utilisateur_id),
  INDEX (statut),
  INDEX (date_demande)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historique des soldes
CREATE TABLE IF NOT EXISTS historique_soldes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  variation INT NOT NULL,
  motif_changement VARCHAR(255) NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_solde_utilisateur FOREIGN KEY (utilisateur_id) 
    REFERENCES utilisateurs(id) ON DELETE CASCADE,
  INDEX (utilisateur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit des demandes
CREATE TABLE IF NOT EXISTS audit_demandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  action ENUM('creation','soumission','validation','refus','annulation','mise_a_jour') NOT NULL,
  fait_par INT NULL,
  commentaire TEXT NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_demande FOREIGN KEY (demande_id) 
    REFERENCES demandes(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_utilisateur FOREIGN KEY (fait_par) 
    REFERENCES utilisateurs(id) ON DELETE SET NULL,
  INDEX (demande_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Jours fériés
CREATE TABLE IF NOT EXISTS jours_feries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_ferie DATE NOT NULL,
  nom VARCHAR(255) NULL,
  pays VARCHAR(50) NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date_ferie (date_ferie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données initiales
INSERT IGNORE INTO roles (id, nom) VALUES
  (1, 'employe'),
  (2, 'manager'),
  (3, 'admin');

INSERT IGNORE INTO types_conges (nom, piece_jointe_requise, couleur) VALUES
  ('Congé Payé', 0, '#10b981'),
  ('Maladie', 1, '#f97316'),
  ('Sans Solde', 0, '#ef4444'),
  ('RTT', 0, '#3b82f6'),
  ('Événement Familial', 0, '#8b5cf6');

INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
VALUES ('Admin Principal', 'admin@entreprise.com', NULL, 3, 30, 0);
```

### 3.2 Importer le schéma dans MySQL

```powershell
# Méthode 1 : Via MySQL en ligne de commande
mysql -u root -p < backend\db.sql

# Méthode 2 : Via phpMyAdmin (XAMPP/WAMP)
# 1. Ouvrir phpMyAdmin (http://localhost/phpmyadmin)
# 2. Sélectionner "Import"
# 3. Choisir le fichier backend/db.sql
# 4. Cliquer sur "Exécuter"
```

### 3.3 Créer le fichier de configuration

Créer `backend/config.ini` :
```ini
[database]
DB_HOST = 127.0.0.1
DB_NAME = gestion_conges
DB_USER = root
DB_PASS = 
DB_PORT = 3306
```

**Note** : Modifier `DB_PASS` si vous avez un mot de passe MySQL.

---

## 📋 ÉTAPE 4 : BACKEND PHP

### 4.1 Créer Database.php

Créer `backend/src/Database.php` :
```php
<?php
class Database {
    private static $pdo = null;

    public static function getPdo() {
        if (self::$pdo !== null) return self::$pdo;
        
        $cfg = parse_ini_file(__DIR__ . '/../config.ini');
        $host = $cfg['DB_HOST'] ?? '127.0.0.1';
        $db   = $cfg['DB_NAME'] ?? 'gestion_conges';
        $user = $cfg['DB_USER'] ?? 'root';
        $pass = $cfg['DB_PASS'] ?? '';
        $port = $cfg['DB_PORT'] ?? 3306;
        
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        
        self::$pdo = new PDO($dsn, $user, $pass, $opts);
        return self::$pdo;
    }
}
```

### 4.2 Créer Helpers.php

Créer `backend/src/Helpers.php` :
```php
<?php
function respondJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

function daysBetweenInclusive($start, $end) {
    $d1 = new DateTime($start);
    $d2 = new DateTime($end);
    if ($d2 < $d1) return 0;
    $diff = $d2->diff($d1);
    return $diff->days + 1;
}

function getCurrentUserId() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-Id'])) return (int)$headers['X-User-Id'];
    if (isset($headers['x-user-id'])) return (int)$headers['x-user-id'];
    return 1; // fallback pour dev
}
```

### 4.3 Créer RequestController.php

Créer `backend/src/RequestController.php` :
```php
<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class RequestController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    // GET /api/requests?user_id=&status=
    public function listRequests($query) {
        $sql = "SELECT r.*, u.nom_complet as requester_name, t.nom as type_name
                FROM demandes r
                JOIN utilisateurs u ON u.id = r.utilisateur_id
                JOIN types_conges t ON t.id = r.type_id
                WHERE 1=1";
        $params = [];

        if (!empty($query['user_id'])) {
            $sql .= " AND r.utilisateur_id = ?";
            $params[] = (int)$query['user_id'];
        }
        if (!empty($query['status'])) {
            $sql .= " AND r.statut = ?";
            $params[] = $query['status'];
        }

        $sql .= " ORDER BY r.date_demande DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        respondJson($rows);
    }

    // GET /api/requests/:id
    public function getRequest($id) {
        $stmt = $this->pdo->prepare("SELECT r.*, u.nom_complet as requester_name, t.nom as type_name
            FROM demandes r
            JOIN utilisateurs u ON u.id = r.utilisateur_id
            JOIN types_conges t ON t.id = r.type_id
            WHERE r.id = ?");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) respondJson(['error' => 'Not found'], 404);
        respondJson($row);
    }

    // POST /api/requests
    public function createRequest($data) {
        $required = ['utilisateur_id', 'type_id', 'date_debut', 'date_fin'];
        foreach ($required as $r) {
            if (empty($data[$r])) respondJson(['error' => "$r missing"], 400);
        }

        $start = $data['date_debut'];
        $end = $data['date_fin'];
        try {
            $days = daysBetweenInclusive($start, $end);
        } catch (Exception $e) {
            respondJson(['error' => 'Dates invalides'], 400);
        }
        if ($days <= 0) respondJson(['error' => 'date_fin must be >= date_debut'], 400);

        $stmt = $this->pdo->prepare("INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, piece_jointe_id, statut) VALUES (?, ?, ?, ?, ?, ?, NULL, 'en_attente')");
        $stmt->execute([
            (int)$data['utilisateur_id'],
            (int)$data['type_id'],
            $start,
            $end,
            $days,
            $data['motif'] ?? null
        ]);
        $id = $this->pdo->lastInsertId();

        $this->pdo->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, 'creation', ?, ?)")->execute([$id, getCurrentUserId(), null]);

        respondJson(['ok' => true, 'id' => $id], 201);
    }

    // PATCH /api/requests/:id/status
    public function updateStatus($id, $payload) {
        $allowed = ['validee', 'refusee', 'annulee'];
        if (empty($payload['status']) || !in_array($payload['status'], $allowed)) {
            respondJson(['error' => 'statut invalide'], 400);
        }
        $status = $payload['status'];
        $handled_by = getCurrentUserId();
        $comment = $payload['handle_comment'] ?? null;

        try {
            $this->pdo->beginTransaction();
            $stmt = $this->pdo->prepare("SELECT * FROM demandes WHERE id = ? FOR UPDATE");
            $stmt->execute([(int)$id]);
            $req = $stmt->fetch();
            if (!$req) {
                $this->pdo->rollBack();
                respondJson(['error' => 'Request not found'], 404);
            }

            if ($req['statut'] !== 'en_attente') {
                $this->pdo->rollBack();
                respondJson(['error' => 'Request already processed or not in pending'], 400);
            }

            if ($status === 'validee') {
                $stmt2 = $this->pdo->prepare("SELECT solde_total, solde_consomme FROM utilisateurs WHERE id = ? FOR UPDATE");
                $stmt2->execute([(int)$req['utilisateur_id']]);
                $user = $stmt2->fetch();
                if (!$user) {
                    $this->pdo->rollBack();
                    respondJson(['error' => 'User not found'], 500);
                }
                $remaining = (int)$user['solde_total'] - (int)$user['solde_consomme'];
                $need = (int)$req['nb_jours'];
                if ($need > $remaining) {
                    $this->pdo->rollBack();
                    respondJson(['error' => 'Insufficient balance'], 400);
                }
                $upd = $this->pdo->prepare("UPDATE demandes SET statut = 'validee', traite_par = ?, date_traitement = NOW(), commentaire_traitement = ? WHERE id = ?");
                $upd->execute([$handled_by, $comment, (int)$id]);

                $uupd = $this->pdo->prepare("UPDATE utilisateurs SET solde_consomme = solde_consomme + ? WHERE id = ?");
                $uupd->execute([$need, (int)$req['utilisateur_id']]);

                $hist = $this->pdo->prepare("INSERT INTO historique_soldes (utilisateur_id, variation, motif_changement) VALUES (?, ?, ?)");
                $hist->execute([(int)$req['utilisateur_id'], -$need, "Validation demande #$id"]);
            } else {
                $upd = $this->pdo->prepare("UPDATE demandes SET statut = ?, traite_par = ?, date_traitement = NOW(), commentaire_traitement = ? WHERE id = ?");
                $upd->execute([$status, $handled_by, $comment, (int)$id]);
            }

            $action = ($status === 'validee') ? 'validation' : ($status === 'refusee' ? 'refus' : 'annulation');
            $this->pdo->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, ?, ?, ?)")->execute([(int)$id, $action, $handled_by, $comment]);

            $this->pdo->commit();
            respondJson(['ok' => true]);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            respondJson(['error' => $e->getMessage()], 500);
        }
    }

    // GET /api/stats
    public function stats($query) {
        $totalUsers = (int)$this->pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();

        $sqlFilter = "WHERE 1=1";
        $params = [];
        if (!empty($query['start'])) {
            $sqlFilter .= " AND date_demande >= ?";
            $params[] = $query['start'];
        }
        if (!empty($query['end'])) {
            $sqlFilter .= " AND date_demande <= ?";
            $params[] = $query['end'] . " 23:59:59";
        }

        $stmt = $this->pdo->prepare("SELECT statut, COUNT(*) AS cnt FROM demandes $sqlFilter GROUP BY statut");
        $stmt->execute($params);
        $byStatus = $stmt->fetchAll();

        $stmt2 = $this->pdo->prepare("SELECT t.nom AS type, COUNT(*) AS cnt FROM demandes d JOIN types_conges t ON t.id = d.type_id $sqlFilter GROUP BY t.nom");
        $stmt2->execute($params);
        $byType = $stmt2->fetchAll();

        $stmt3 = $this->pdo->prepare("
            SELECT DATE_FORMAT(date_demande, '%Y-%m') AS month, COUNT(*) AS cnt
            FROM demandes
            GROUP BY DATE_FORMAT(date_demande, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        ");
        $stmt3->execute();
        $perMonth = $stmt3->fetchAll();

        respondJson([
            'totalUsers' => $totalUsers,
            'byStatus' => $byStatus,
            'byType' => $byType,
            'perMonth' => $perMonth
        ]);
    }
}
```

### 4.4 Créer index.php (Point d'entrée API)

Créer `backend/public/index.php` :
```php
<?php
require_once __DIR__ . '/../src/RequestController.php';
require_once __DIR__ . '/../src/Helpers.php';

// CORS (autoriser le frontend local)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$relative = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$ctrl = new RequestController();
$method = $_SERVER['REQUEST_METHOD'];
$segments = array_values(array_filter(explode('/', $relative)));

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'requests') {
    if ($method === 'GET' && count($segments) === 2) {
        $ctrl->listRequests($_GET);
    }
    if ($method === 'POST' && count($segments) === 2) {
        $data = getJsonInput();
        $ctrl->createRequest($data);
    }
    if ($method === 'GET' && count($segments) === 3) {
        $ctrl->getRequest($segments[2]);
    }
    if (($method === 'PATCH' || $method === 'POST') && count($segments) === 4 && $segments[3] === 'status') {
        $payload = getJsonInput();
        $ctrl->updateStatus($segments[2], $payload);
    }
    respondJson(['error' => 'Not found'], 404);
}

if ($method === 'GET' && $relative === '/api/stats') {
    $ctrl->stats($_GET);
}

respondJson(['error' => 'Not found'], 404);
```

---

## 📋 ÉTAPE 5 : COMPOSANTS REACT - BASE

### 5.1 Créer Layout.jsx

Créer `frontend/src/components/Layout.jsx` :
```jsx
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children, userEmail, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 bg-gray-50">
        <Header userEmail={userEmail} onLogout={handleLogout} />
        <main className="p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
```

### 5.2 Créer Sidebar.jsx

Créer `frontend/src/components/Sidebar.jsx` :
```jsx
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { path: '/statistiques', label: 'Statistiques', icon: '📈' },
    { path: '/nouvelle-demande', label: '+ Nouvelle Demande', icon: '+' },
    { path: '/mes-demandes', label: 'Mes Demandes', icon: '👤' },
    { path: '/calendrier', label: 'Calendrier', icon: '📅' },
    { path: '/validation', label: 'Validation', icon: '✓' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-800 text-white min-h-screen fixed left-0 top-0 z-10 shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-8 text-white">DYNAMIX SERVICES</h1>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
```

### 5.3 Créer Header.jsx

Créer `frontend/src/components/Header.jsx` :
```jsx
function Header({ userEmail, onLogout }) {
  const getUserName = () => {
    if (!userEmail) return 'Utilisateur';
    const name = userEmail.split('@')[0];
    return name.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || userEmail;
  };

  const userName = getUserName();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white bg-slate-800 px-4 py-2 rounded">DYNAMIX SERVICES</h1>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Espace Manager</h2>
          <p className="text-xs text-gray-500">Vue d'overview et suivi des congés par employé</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
            <button 
              onClick={onLogout} 
              className="text-gray-400 hover:text-gray-600 ml-2 text-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
```

### 5.4 Créer Login.jsx

Créer `frontend/src/Login.jsx` :
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Veuillez saisir votre email.');
      return;
    }
    setError('');
    if (onLogin) {
      onLogin(email, 1);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DYNAMIX SERVICES</h1>
          <h2 className="text-xl font-semibold text-gray-600">Gestion des Congés</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="votre.email@entreprise.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
```

---

## 📋 ÉTAPE 6 : PAGES REACT

### 6.1 Créer App.jsx avec les routes

Créer `frontend/src/App.jsx` :
```jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './pages/Dashboard';
import Statistiques from './pages/Statistiques';
import NouvelleDemande from './pages/NouvelleDemande';
import MesDemandes from './pages/MesDemandes';
import Validation from './pages/Validation';
import Calendrier from './pages/Calendrier';

function App() {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [userId, setUserId] = useState(parseInt(localStorage.getItem('userId')) || 1);

  const handleLogin = (email, id) => {
    setUserEmail(email);
    setUserId(id);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', id);
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserId(1);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            userEmail ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            userEmail ? (
              <Dashboard userEmail={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistiques"
          element={
            userEmail ? (
              <Statistiques userEmail={userEmail} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/nouvelle-demande"
          element={
            userEmail ? (
              <NouvelleDemande userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/mes-demandes"
          element={
            userEmail ? (
              <MesDemandes userEmail={userEmail} userId={userId} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/validation"
          element={
            userEmail ? (
              <Validation userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendrier"
          element={
            userEmail ? (
              <Calendrier userEmail={userEmail} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

**Note** : Les fichiers des pages (Dashboard, Statistiques, NouvelleDemande, MesDemandes, Validation, Calendrier) et le composant SuiviCollaborateurs sont trop longs pour être inclus ici. Consultez les fichiers existants dans `frontend/src/pages/` et `frontend/src/components/` pour leur contenu complet.

---

## 📋 ÉTAPE 7 : LANCER L'APPLICATION

### 7.1 Lancer le backend PHP

```powershell
# Ouvrir un terminal PowerShell
cd backend\public
php -S localhost:8000
```

### 7.2 Lancer le frontend React

```powershell
# Ouvrir un autre terminal PowerShell
cd frontend
npm run dev
```

### 7.3 Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000

---

## ✅ Résumé des Fichiers Créés

### Backend
- `backend/config.ini` - Configuration base de données
- `backend/db.sql` - Schéma SQL complet
- `backend/src/Database.php` - Classe de connexion DB
- `backend/src/Helpers.php` - Fonctions utilitaires
- `backend/src/RequestController.php` - Contrôleur API
- `backend/public/index.php` - Point d'entrée API

### Frontend
- `frontend/src/components/Layout.jsx` - Layout principal
- `frontend/src/components/Sidebar.jsx` - Navigation latérale
- `frontend/src/components/Header.jsx` - En-tête
- `frontend/src/components/SuiviCollaborateurs.jsx` - Tableau employés
- `frontend/src/Login.jsx` - Page de connexion
- `frontend/src/App.jsx` - Routes et app principale
- `frontend/src/pages/Dashboard.jsx` - Tableau de bord
- `frontend/src/pages/Statistiques.jsx` - Graphiques
- `frontend/src/pages/NouvelleDemande.jsx` - Formulaire demande
- `frontend/src/pages/MesDemandes.jsx` - Historique utilisateur
- `frontend/src/pages/Validation.jsx` - Validation manager
- `frontend/src/pages/Calendrier.jsx` - Page calendrier
- `frontend/vite.config.js` - Config Vite
- `frontend/tailwind.config.js` - Config Tailwind
- `frontend/postcss.config.js` - Config PostCSS

---

## 🎯 Prochaines Étapes

Consultez le document `GUIDE_IMPLEMENTATION_MANUELLE.md` pour implémenter les fonctionnalités manquantes.

