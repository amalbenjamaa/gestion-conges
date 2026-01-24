-- Script pour ajouter le champ "date_naissance" à la table utilisateurs
-- Usage: mysql -u root -p gestion_conges < backend/scripts/add_date_naissance_field.sql

USE gestion_conges;

-- Ajouter la colonne date_naissance si elle n'existe pas déjà
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS date_naissance DATE NULL AFTER position;

SELECT 'Colonne date_naissance ajoutée avec succès!' as message;


