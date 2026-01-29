-- Script pour ajouter les champs "telephone" et "bureau" à la table utilisateurs
-- Usage: mysql -u root -p gestion_conges < backend/scripts/add_telephone_bureau_fields.sql

USE gestion_conges;

ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(30) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS bureau VARCHAR(100) NULL AFTER telephone;

SELECT 'Colonnes telephone et bureau ajoutées avec succès!' AS message;

