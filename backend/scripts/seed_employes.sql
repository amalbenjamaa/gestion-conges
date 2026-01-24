-- Script pour insérer des employés de test dans la base de données
-- Usage: mysql -u root -p gestion_conges < backend/scripts/seed_employes.sql

USE gestion_conges;

-- S'assurer que les rôles existent (seulement employe et manager, pas admin)
INSERT IGNORE INTO roles (id, nom) VALUES
  (1, 'employe'),
  (2, 'manager');

-- Insérer des employés avec mots de passe hashés (mot de passe = "password123" pour tous)
-- Hash généré avec: password_hash('password123', PASSWORD_DEFAULT)
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme) VALUES
  ('Jean Dupont', 'jean.dupont@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 12),
  ('Sophie Martin', 'sophie.martin@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 20),
  ('Lucas Bernard', 'lucas.bernard@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 5),
  ('Claire Dubois', 'claire.dubois@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 8),
  ('Thomas Leroy', 'thomas.leroy@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 15),
  ('Émilie Roux', 'emilie.roux@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 2),
  ('Marc Lefebvre', 'marc.lefebvre@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 10),
  ('Julie Moreau', 'julie.moreau@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 18),
  ('Pierre Garnier', 'pierre.garnier@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 6),
  ('Marie Petit', 'marie.petit@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 25, 9)
ON DUPLICATE KEY UPDATE nom_complet = VALUES(nom_complet);

-- Insérer quelques demandes de congés validées pour le calendrier
-- (Assure-toi que les types_conges existent d'abord)
INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, statut, date_demande) VALUES
  (1, 1, '2024-10-01', '2024-10-05', 5, 'Vacances', 'validee', NOW()),
  (2, 1, '2024-10-09', '2024-10-11', 3, 'Repos', 'validee', NOW()),
  (3, 1, '2024-10-15', '2024-10-16', 2, 'Weekend prolongé', 'validee', NOW()),
  (4, 1, '2024-10-18', '2024-10-20', 3, 'Vacances', 'validee', NOW()),
  (6, 1, '2024-10-22', '2024-10-25', 4, 'Repos', 'validee', NOW()),
  (7, 1, '2024-10-26', '2024-10-27', 2, 'Weekend prolongé', 'validee', NOW())
ON DUPLICATE KEY UPDATE motif = VALUES(motif);

-- Insérer quelques demandes en attente pour la page Validation
INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, statut, date_demande) VALUES
  (5, 2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 9 DAY), 3, 'Arrêt maladie', 'en_attente', NOW()),
  (8, 1, DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 5, 'Vacances de fin d\'année', 'en_attente', NOW()),
  (9, 1, DATE_ADD(CURDATE(), INTERVAL 21 DAY), DATE_ADD(CURDATE(), INTERVAL 22 DAY), 2, 'Weekend prolongé', 'en_attente', NOW())
ON DUPLICATE KEY UPDATE motif = VALUES(motif);

