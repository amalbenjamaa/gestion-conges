-- Script pour ajouter le champ "position" à la table utilisateurs
-- Usage: mysql -u root -p gestion_conges < backend/scripts/add_position_field.sql

USE gestion_conges;

-- Ajouter la colonne position si elle n'existe pas déjà
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL AFTER nom_complet;

-- Mettre à jour les positions existantes si nécessaire (optionnel)
-- UPDATE utilisateurs SET position = 'Développeur' WHERE position IS NULL AND role_id = 1;
-- UPDATE utilisateurs SET position = 'Manager RH' WHERE position IS NULL AND role_id = 2;

SELECT 'Colonne position ajoutée avec succès!' as message;



