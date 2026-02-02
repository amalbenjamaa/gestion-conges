-- Script de migration : Ajout du numéro de téléphone et table de codes de réinitialisation
-- Usage: mysql -u root -p gestion_conges < backend/scripts/add_phone_number.sql

USE gestion_conges;

-- Ajouter la colonne numero_telephone si elle n'existe pas
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS numero_telephone VARCHAR(20) NULL AFTER email;

-- Créer la table pour les codes de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  code VARCHAR(6) NOT NULL,
  reset_token VARCHAR(64) NULL,
  expire_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_code (code),
  INDEX idx_reset_token (reset_token),
  INDEX idx_expire_at (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SELECT 'Migration terminée : colonne numero_telephone et table password_reset_codes créées avec succès!' AS message;
