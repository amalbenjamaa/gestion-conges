-- ============================================================================
-- Script pour supprimer tous les utilisateurs et réinitialiser la base de données
-- Usage: mysql -u root -p gestion_conges < backend/scripts/reset_database.sql
-- 
-- Ce script :
-- 1. Supprime toutes les données (utilisateurs, demandes, etc.)
-- 2. Réinitialise les compteurs AUTO_INCREMENT à 1
-- 3. Remet en place les rôles de base (employe, manager)
-- 4. Remet en place les types de congés de base
-- ============================================================================

USE gestion_conges;

-- ============================================================================
-- ÉTAPE 1 : Désactiver les contraintes de clés étrangères
-- (Permet de supprimer les données même si d'autres tables y font référence)
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- ÉTAPE 2 : Supprimer toutes les données et réinitialiser les compteurs AUTO_INCREMENT
-- AUTO_INCREMENT : Remet le compteur à 1 pour que les nouveaux enregistrements
--                  commencent à ID = 1 (au lieu de continuer là où on s'est arrêté)
-- ============================================================================

-- Supprimer toutes les demandes
DELETE FROM demandes;
ALTER TABLE demandes AUTO_INCREMENT = 1;  -- Remet le compteur à 1

-- Supprimer tous les utilisateurs
DELETE FROM utilisateurs;
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;  -- Remet le compteur à 1

-- Supprimer l'historique des soldes
DELETE FROM historique_soldes;
ALTER TABLE historique_soldes AUTO_INCREMENT = 1;  -- Remet le compteur à 1

-- Supprimer les pièces jointes
DELETE FROM pieces_jointes;
ALTER TABLE pieces_jointes AUTO_INCREMENT = 1;  -- Remet le compteur à 1

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ÉTAPE 3 : Remettre en place les rôles de base
-- IDs fixes : 1 = employe, 2 = manager (importants car référencés par utilisateurs.role_id)
-- ============================================================================
DELETE FROM roles;
ALTER TABLE roles AUTO_INCREMENT = 1;  -- Remet le compteur à 1

-- Recréer les rôles avec des IDs fixes
INSERT INTO roles (id, nom) VALUES
  (1, 'employe'),   -- ID fixe = 1 (pour employé)
  (2, 'manager');   -- ID fixe = 2 (pour manager)

-- ============================================================================
-- ÉTAPE 4 : Remettre en place les types de congés de base
-- INSERT IGNORE : Si le type existe déjà, on l'ignore (pas d'erreur)
--                 Si le type n'existe pas, on le crée
-- IDs fixes : 1 à 5 (correspondent aux IDs utilisés dans le frontend)
-- ============================================================================
INSERT IGNORE INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),          -- Vert, pas de pièce jointe
  (2, 'Maladie', 1, '#f97316'),             -- Orange, pièce jointe requise
  (3, 'Sans Solde', 0, '#ef4444'),          -- Rouge, pas de pièce jointe
  (4, 'RTT', 0, '#3b82f6'),                 -- Bleu, pas de pièce jointe
  (5, 'Événement Familial', 0, '#8b5cf6');  -- Violet, pas de pièce jointe

-- ============================================================================
-- ÉTAPE 5 : Affichage de vérification
-- ============================================================================
SELECT '✅ Base de données réinitialisée avec succès!' as message;
SELECT '' as '';
SELECT '📋 Rôles disponibles:' as info;
SELECT * FROM roles;
SELECT '' as '';
SELECT '📝 Types de congés disponibles:' as info;
SELECT * FROM types_conges;

