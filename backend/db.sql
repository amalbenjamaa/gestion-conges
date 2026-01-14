-- Création de la base et des tables pour "gestion_conges"
-- Charset utf8mb4 pour supporter les accents / émoticônes
CREATE DATABASE IF NOT EXISTS `gestion_conges` DEFAULT CHARACTER SET = 'utf8mb4' DEFAULT COLLATE = 'utf8mb4_general_ci';
USE `gestion_conges`;

-- Table des rôles (ex: employe, manager, admin)
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
  mot_de_passe VARCHAR(255) NULL, -- stocke le hash
  role_id INT NOT NULL DEFAULT 1, -- FK vers roles
  avatar_url VARCHAR(512) NULL,
  solde_total INT DEFAULT 0,  -- allocation totale (ex: 25)
  solde_consomme INT DEFAULT 0, -- jours pris
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  CONSTRAINT fk_utilisateurs_roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Types de congés (payé, maladie, sans solde, etc.)
CREATE TABLE IF NOT EXISTS types_conges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  piece_jointe_requise TINYINT(1) NOT NULL DEFAULT 0,
  couleur VARCHAR(7) DEFAULT '#3b82f6', -- hex code pour l'interface
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stockage des fichiers joints (justificatifs)
CREATE TABLE IF NOT EXISTS pieces_jointes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_fichier VARCHAR(255) NOT NULL,
  chemin_fichier VARCHAR(1024) NOT NULL,
  type_mime VARCHAR(100) NULL,
  taille INT NULL,
  telecharge_par INT NULL, -- FK utilisateurs
  telecharge_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pieces_utilisateurs FOREIGN KEY (telecharge_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table principale des demandes de congés
CREATE TABLE IF NOT EXISTS demandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,         -- qui demande
  type_id INT NOT NULL,                -- quel type
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nb_jours INT NOT NULL,               -- jours calculés
  motif TEXT NULL,
  piece_jointe_id INT NULL,            -- FK pieces_jointes
  statut ENUM('en_attente','validee','refusee','annulee') DEFAULT 'en_attente',
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  traite_par INT NULL,                 -- manager qui a validé/refusé
  date_traitement TIMESTAMP NULL,
  commentaire_traitement TEXT NULL,    -- raison du refus par ex
  CONSTRAINT fk_demandes_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  CONSTRAINT fk_demandes_type FOREIGN KEY (type_id) REFERENCES types_conges(id) ON DELETE RESTRICT,
  CONSTRAINT fk_demandes_piece FOREIGN KEY (piece_jointe_id) REFERENCES pieces_jointes(id) ON DELETE SET NULL,
  CONSTRAINT fk_demandes_traite_par FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
  INDEX (utilisateur_id),
  INDEX (statut),
  INDEX (date_demande)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historique des mouvements de solde (audit)
CREATE TABLE IF NOT EXISTS historique_soldes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  variation INT NOT NULL, -- ex: -5 (prise de congé), +5 (ajout RH)
  motif_changement VARCHAR(255) NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_solde_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  INDEX (utilisateur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Log d'actions / audit pour les demandes
CREATE TABLE IF NOT EXISTS audit_demandes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demande_id INT NOT NULL,
  action ENUM('creation','soumission','validation','refus','annulation','mise_a_jour') NOT NULL,
  fait_par INT NULL, -- utilisateur acteur
  commentaire TEXT NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_demande FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_utilisateur FOREIGN KEY (fait_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
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

-- Données initiales (Seed)
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

-- Admin par défaut
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
VALUES ('Admin Principal', 'admin@entreprise.com', NULL, 3, 30, 0);
