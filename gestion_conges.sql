-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : lun. 02 fév. 2026 à 17:50
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gestion_conges`
--

-- --------------------------------------------------------

--
-- Structure de la table `audit_demandes`
--

DROP TABLE IF EXISTS `audit_demandes`;
CREATE TABLE IF NOT EXISTS `audit_demandes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `demande_id` int NOT NULL,
  `action` enum('creation','soumission','validation','refus','annulation','mise_a_jour') NOT NULL,
  `fait_par` int DEFAULT NULL,
  `commentaire` text,
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_utilisateur` (`fait_par`),
  KEY `demande_id` (`demande_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `audit_demandes`
--

INSERT INTO `audit_demandes` (`id`, `demande_id`, `action`, `fait_par`, `commentaire`, `cree_le`) VALUES
(1, 1, 'creation', 2, NULL, '2026-01-21 10:46:29'),
(2, 1, '', 1, NULL, '2026-01-21 11:33:05'),
(3, 2, 'creation', 2, NULL, '2026-01-21 11:34:00'),
(4, 2, '', 1, NULL, '2026-01-21 11:34:19'),
(5, 3, 'creation', 2, NULL, '2026-01-21 11:37:37'),
(6, 3, '', 1, 'non jours atteints', '2026-01-21 11:39:00'),
(7, 4, 'creation', 2, NULL, '2026-01-21 11:54:18'),
(8, 4, '', 1, NULL, '2026-01-21 11:54:52'),
(9, 5, 'creation', 2, NULL, '2026-01-22 11:13:44'),
(10, 5, '', 1, NULL, '2026-01-22 11:14:40'),
(13, 7, 'creation', 3, NULL, '2026-01-27 09:08:53'),
(14, 7, '', 6, NULL, '2026-01-27 09:09:58'),
(15, 8, 'creation', 3, NULL, '2026-01-27 09:22:20'),
(16, 8, '', 6, NULL, '2026-01-27 21:37:10'),
(17, 9, 'creation', 3, NULL, '2026-01-29 21:05:03'),
(18, 9, '', 1, NULL, '2026-01-29 21:15:56'),
(19, 10, 'creation', 3, NULL, '2026-01-30 00:41:47'),
(20, 11, 'creation', 14, NULL, '2026-01-30 21:12:43'),
(21, 11, '', 1, NULL, '2026-01-30 21:51:10'),
(22, 10, '', 1, NULL, '2026-01-30 22:21:12'),
(23, 12, 'creation', 9, NULL, '2026-01-30 22:46:48'),
(24, 12, '', 6, NULL, '2026-01-30 22:47:09'),
(25, 13, 'creation', 14, NULL, '2026-01-30 23:25:01'),
(26, 13, '', 6, NULL, '2026-01-30 23:25:19'),
(27, 14, 'creation', 3, NULL, '2026-01-31 01:16:13'),
(28, 15, 'creation', 14, NULL, '2026-02-02 14:35:19'),
(29, 15, '', 1, NULL, '2026-02-02 14:35:32');

-- --------------------------------------------------------

--
-- Structure de la table `demandes`
--

DROP TABLE IF EXISTS `demandes`;
CREATE TABLE IF NOT EXISTS `demandes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `type_id` int NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `nb_jours` int NOT NULL,
  `motif` text,
  `piece_jointe_id` int DEFAULT NULL,
  `statut` enum('en_attente','validee','refusee','annulee') DEFAULT 'en_attente',
  `date_demande` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `traite_par` int DEFAULT NULL,
  `date_traitement` timestamp NULL DEFAULT NULL,
  `commentaire_traitement` text,
  PRIMARY KEY (`id`),
  KEY `fk_demandes_type` (`type_id`),
  KEY `fk_demandes_piece` (`piece_jointe_id`),
  KEY `fk_demandes_traite_par` (`traite_par`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `statut` (`statut`),
  KEY `date_demande` (`date_demande`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `demandes`
--

INSERT INTO `demandes` (`id`, `utilisateur_id`, `type_id`, `date_debut`, `date_fin`, `nb_jours`, `motif`, `piece_jointe_id`, `statut`, `date_demande`, `traite_par`, `date_traitement`, `commentaire_traitement`) VALUES
(1, 2, 1, '2026-01-22', '2026-01-25', 4, '', NULL, 'validee', '2026-01-21 10:46:29', NULL, NULL, NULL),
(2, 2, 2, '2026-01-20', '2026-01-21', 2, '', NULL, 'validee', '2026-01-21 11:34:00', NULL, NULL, NULL),
(3, 2, 3, '2026-02-01', '2026-02-03', 3, '', NULL, 'refusee', '2026-01-21 11:37:37', NULL, NULL, NULL),
(4, 2, 1, '2026-01-31', '2026-01-31', 1, '', NULL, 'refusee', '2026-01-21 11:54:18', NULL, NULL, NULL),
(5, 2, 1, '2026-03-01', '2026-03-02', 2, '', NULL, 'validee', '2026-01-22 11:13:44', NULL, NULL, NULL),
(7, 3, 4, '2026-01-28', '2026-01-29', 2, '', NULL, 'validee', '2026-01-27 09:08:53', NULL, NULL, NULL),
(8, 3, 4, '2026-01-01', '2026-01-02', 2, '', NULL, 'validee', '2026-01-27 09:22:20', NULL, NULL, NULL),
(9, 3, 5, '2026-01-30', '2026-01-31', 2, '', NULL, 'validee', '2026-01-29 21:05:03', NULL, NULL, NULL),
(10, 3, 5, '2026-03-07', '2026-03-10', 4, '', NULL, 'validee', '2026-01-30 00:41:47', NULL, NULL, NULL),
(11, 14, 3, '2026-04-01', '2026-04-05', 5, 'aaa', NULL, 'validee', '2026-01-30 21:12:42', NULL, NULL, NULL),
(12, 9, 2, '2026-02-01', '2026-02-04', 4, '', NULL, 'validee', '2026-01-30 22:46:48', NULL, NULL, NULL),
(13, 14, 2, '2026-05-01', '2026-05-03', 3, '', NULL, 'refusee', '2026-01-30 23:25:01', NULL, NULL, NULL),
(14, 3, 4, '2026-05-27', '2026-05-30', 4, '', NULL, 'en_attente', '2026-01-31 01:16:13', NULL, NULL, NULL),
(15, 14, 3, '2026-02-01', '2026-02-03', 3, '', NULL, 'validee', '2026-02-02 14:35:19', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `historique_soldes`
--

DROP TABLE IF EXISTS `historique_soldes`;
CREATE TABLE IF NOT EXISTS `historique_soldes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `variation` int NOT NULL,
  `motif_changement` varchar(255) DEFAULT NULL,
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `jours_feries`
--

DROP TABLE IF EXISTS `jours_feries`;
CREATE TABLE IF NOT EXISTS `jours_feries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_ferie` date NOT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `pays` varchar(50) DEFAULT NULL,
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_date_ferie` (`date_ferie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `message` varchar(500) NOT NULL,
  `est_lu` tinyint(1) NOT NULL DEFAULT '0',
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `demande_id` int DEFAULT NULL,
  `request_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateur_id` (`utilisateur_id`),
  KEY `est_lu` (`est_lu`),
  KEY `idx_notif_demande_id` (`demande_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `utilisateur_id`, `message`, `est_lu`, `cree_le`, `demande_id`, `request_id`) VALUES
(1, 1, 'Nouvelle demande de motaz (2026-03-01 → 2026-03-02)', 1, '2026-01-22 11:13:44', NULL, NULL),
(2, 2, 'Votre demande (2026-03-01 → 2026-03-02) a été acceptée.', 1, '2026-01-22 11:14:40', NULL, NULL),
(3, 1, 'Nouvelle demande de Amal Benjamaa (2026-01-01 → 2026-01-03)', 1, '2026-01-24 15:09:17', NULL, NULL),
(5, 1, 'Nouvelle demande de rachida (2026-01-28 → 2026-01-29)', 1, '2026-01-27 09:08:53', NULL, NULL),
(6, 6, 'Nouvelle demande de rachida (2026-01-28 → 2026-01-29)', 1, '2026-01-27 09:08:53', NULL, NULL),
(7, 3, 'Votre demande (2026-01-28 → 2026-01-29) a été acceptée.', 1, '2026-01-27 09:09:58', NULL, NULL),
(8, 1, 'Nouvelle demande de rachida (2026-01-01 → 2026-01-02)', 1, '2026-01-27 09:22:20', NULL, NULL),
(9, 6, 'Nouvelle demande de rachida (2026-01-01 → 2026-01-02)', 1, '2026-01-27 09:22:20', NULL, NULL),
(10, 3, 'Votre demande (2026-01-01 → 2026-01-02) a été acceptée.', 1, '2026-01-27 21:37:10', NULL, NULL),
(11, 1, 'Nouvelle demande de rachida (2026-01-30 → 2026-01-31)', 1, '2026-01-29 21:05:03', NULL, NULL),
(12, 6, 'Nouvelle demande de rachida (2026-01-30 → 2026-01-31)', 1, '2026-01-29 21:05:03', NULL, NULL),
(13, 8, 'Nouvelle demande de rachida (2026-01-30 → 2026-01-31)', 0, '2026-01-29 21:05:03', NULL, NULL),
(14, 3, 'Votre demande (2026-01-30 → 2026-01-31) a été acceptée.', 0, '2026-01-29 21:15:56', NULL, NULL),
(15, 1, 'Nouvelle demande de rachida (2026-03-07 → 2026-03-10)', 1, '2026-01-30 00:41:47', NULL, NULL),
(16, 6, 'Nouvelle demande de rachida (2026-03-07 → 2026-03-10)', 1, '2026-01-30 00:41:47', NULL, NULL),
(17, 8, 'Nouvelle demande de rachida (2026-03-07 → 2026-03-10)', 0, '2026-01-30 00:41:47', NULL, NULL),
(18, 1, 'Nouvelle demande de mahdi mrad (2026-04-01 → 2026-04-05)', 1, '2026-01-30 21:12:43', NULL, NULL),
(19, 6, 'Nouvelle demande de mahdi mrad (2026-04-01 → 2026-04-05)', 1, '2026-01-30 21:12:43', NULL, NULL),
(20, 8, 'Nouvelle demande de mahdi mrad (2026-04-01 → 2026-04-05)', 0, '2026-01-30 21:12:43', NULL, NULL),
(21, 14, 'Votre demande (2026-04-01 → 2026-04-05) a été acceptée.', 1, '2026-01-30 21:51:10', 11, NULL),
(22, 3, 'Votre demande (2026-03-07 → 2026-03-10) a été acceptée.', 0, '2026-01-30 22:21:12', 10, NULL),
(23, 1, 'Nouvelle demande de hbib bejaoui (2026-02-01 → 2026-02-04)', 1, '2026-01-30 22:46:48', 12, NULL),
(24, 6, 'Nouvelle demande de hbib bejaoui (2026-02-01 → 2026-02-04)', 1, '2026-01-30 22:46:48', 12, NULL),
(25, 8, 'Nouvelle demande de hbib bejaoui (2026-02-01 → 2026-02-04)', 0, '2026-01-30 22:46:48', 12, NULL),
(26, 9, 'Votre demande (2026-02-01 → 2026-02-04) a été acceptée.', 0, '2026-01-30 22:47:09', 12, NULL),
(27, 1, 'Nouvelle demande de mahdi mrad (2026-05-01 → 2026-05-03)', 1, '2026-01-30 23:25:01', 13, NULL),
(28, 6, 'Nouvelle demande de mahdi mrad (2026-05-01 → 2026-05-03)', 1, '2026-01-30 23:25:01', 13, NULL),
(29, 8, 'Nouvelle demande de mahdi mrad (2026-05-01 → 2026-05-03)', 0, '2026-01-30 23:25:01', 13, NULL),
(30, 14, 'Votre demande (2026-05-01 → 2026-05-03) a été refusée.', 1, '2026-01-30 23:25:19', 13, NULL),
(31, 1, 'Nouvelle demande de rachida (2026-05-27 → 2026-05-30)', 1, '2026-01-31 01:16:13', 14, NULL),
(32, 6, 'Nouvelle demande de rachida (2026-05-27 → 2026-05-30)', 0, '2026-01-31 01:16:13', 14, NULL),
(33, 8, 'Nouvelle demande de rachida (2026-05-27 → 2026-05-30)', 0, '2026-01-31 01:16:13', 14, NULL),
(34, 1, 'Nouvelle demande de mahdi mrad (2026-02-01 → 2026-02-03)', 1, '2026-02-02 14:35:19', 15, NULL),
(35, 6, 'Nouvelle demande de mahdi mrad (2026-02-01 → 2026-02-03)', 0, '2026-02-02 14:35:19', 15, NULL),
(36, 8, 'Nouvelle demande de mahdi mrad (2026-02-01 → 2026-02-03)', 0, '2026-02-02 14:35:19', 15, NULL),
(37, 14, 'Votre demande (2026-02-01 → 2026-02-03) a été acceptée.', 0, '2026-02-02 14:35:32', 15, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `pieces_jointes`
--

DROP TABLE IF EXISTS `pieces_jointes`;
CREATE TABLE IF NOT EXISTS `pieces_jointes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_fichier` varchar(255) NOT NULL,
  `chemin_fichier` varchar(1024) NOT NULL,
  `type_mime` varchar(100) DEFAULT NULL,
  `taille` int DEFAULT NULL,
  `telecharge_par` int DEFAULT NULL,
  `telecharge_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pieces_utilisateurs` (`telecharge_par`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL,
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `nom`, `cree_le`) VALUES
(1, 'employe', '2026-01-20 23:47:30'),
(2, 'manager', '2026-01-20 23:47:30');

-- --------------------------------------------------------

--
-- Structure de la table `types_conges`
--

DROP TABLE IF EXISTS `types_conges`;
CREATE TABLE IF NOT EXISTS `types_conges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `piece_jointe_requise` tinyint(1) NOT NULL DEFAULT '0',
  `couleur` varchar(7) DEFAULT '#3b82f6',
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `types_conges`
--

INSERT INTO `types_conges` (`id`, `nom`, `piece_jointe_requise`, `couleur`, `cree_le`) VALUES
(1, 'Congé Payé', 0, '#10b981', '2026-01-12 15:06:27'),
(2, 'Maladie', 1, '#f97316', '2026-01-12 15:06:27'),
(3, 'Sans Solde', 0, '#ef4444', '2026-01-12 15:06:27'),
(4, 'RTT', 0, '#3b82f6', '2026-01-12 15:06:27'),
(5, 'Événement Familial', 0, '#8b5cf6', '2026-01-12 15:06:27');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_complet` varchar(150) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `email` varchar(200) NOT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `role_id` int NOT NULL DEFAULT '1',
  `avatar_url` varchar(512) DEFAULT NULL,
  `solde_total` int DEFAULT '0',
  `solde_consomme` int DEFAULT '0',
  `cree_le` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `manager_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `email_2` (`email`),
  KEY `fk_utilisateurs_roles` (`role_id`),
  KEY `fk_utilisateurs_manager` (`manager_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `nom_complet`, `position`, `date_naissance`, `email`, `mot_de_passe`, `role_id`, `avatar_url`, `solde_total`, `solde_consomme`, `cree_le`, `manager_id`) VALUES
(1, 'amal', NULL, NULL, 'amal@gmail.com', '$2y$10$V513Bsdo/ScvPgGeh7HPiOi6DcW9ehPLRXGENcDzFqoIJRuHMP97e', 2, 'http://localhost:8000/uploads/avatars/avatar_1_6980b469e605f.png', 10, 1, '2026-01-20 23:50:00', NULL),
(2, 'motaz', NULL, NULL, 'motaz@gmail.com', '$2y$10$kDCOLKH2gKKcej1FrHggleazLWpqO9xliV8xwHiRR3PhD.LwcF4CO', 1, '/uploads/avatars/avatar_2_6980a560538e0.png', 10, 10, '2026-01-20 23:50:52', NULL),
(3, 'rachida', NULL, NULL, 'rachida@gmail.com', '$2y$10$AmBPFxsvTWEv9xkkMLlbVudcvj3rzlUCk8nrNKxyTTy6PKFlNrzJC', 1, 'http://localhost:8000/uploads/avatars/avatar_3_697d2eff76a5c.png', 50, 20, '2026-01-21 12:12:56', NULL),
(6, 'bejaoui imen', 'nn', '2026-01-31', 'imen@gmail.com', '$2y$10$YxUX006JNXpLCzx54IRadeZu4vx1QQjlounixH.x9l8yAVYTcbv1C', 2, 'http://localhost:8000/uploads/avatars/avatar_6_6980d7751b474.png', 25, 0, '2026-01-24 15:29:18', 1),
(7, 'brahim Maazi', 'developpeur', '2026-01-01', 'ibrahim@gmail.com', '$2y$10$u.x9Ml4GGMznJ7ZJUfGyS.Nt6aoZyY6rCTK9ZMBBFR8w..IIQcC/m', 1, NULL, 25, 0, '2026-01-27 09:16:35', 1),
(8, 'ferid benjamaa', 'chef projet', '2026-01-30', 'ferid@gmail.com', '$2y$10$6bgL69ZMN.Fl5CZ9rGBnDuJ23mkdQWMsy9FdPSeAeKpeMpesDsEN6', 2, NULL, 25, 0, '2026-01-27 23:58:52', 6),
(9, 'hbib bejaoui', 'sa', '2026-01-02', 'hbib@gmail.com', '$2y$10$ezln3Y16AXm.6kfgkpFcTOhy75QDEKE76x.poM0nRYHn39peMh/6y', 1, NULL, 25, 4, '2026-01-30 00:15:31', 1),
(10, 'hbib bejaoui', 'sa', '2026-01-02', 'habib@gmail.com', '$2y$10$a/T3.HKlG.QJuk6eY/rmSeVHh7yJAT88VkQ66XZCoeQKdf.bQUd26', 1, NULL, 25, 0, '2026-01-30 00:15:46', 1),
(11, 'Amal Benjamaa', NULL, NULL, 'haaabib@gmail.com', NULL, 1, 'https://ui-avatars.com/api/?name=Employee&background=10b981&color=fff&size=200', 25, 0, '2026-01-30 01:32:41', NULL),
(12, 'refka mimouni', NULL, NULL, 'refka@gmail.com', NULL, 1, 'https://ui-avatars.com/api/?name=Employee&background=10b981&color=fff&size=200', 25, 0, '2026-01-30 01:41:44', NULL),
(13, 'nouhe hajji', NULL, NULL, 'nouhe@gmail.com', NULL, 1, 'https://ui-avatars.com/api/?name=Employee&background=10b981&color=fff&size=200', 25, 0, '2026-01-30 19:15:29', NULL),
(14, 'mahdi mrad', NULL, NULL, 'mahdi@gmail.com', '$2y$10$ekB.5DF7DCpjuOUjObcFI.CXyvkZw.r147tEGEoSHpqbkkEA0YiEO', 1, 'https://ui-avatars.com/api/?name=Employee&background=10b981&color=fff&size=200', 25, 8, '2026-01-30 21:12:04', NULL),
(15, 'tesnim solli', NULL, NULL, 'tesnim@gmail.com', '$2y$10$G/aIsLNENvbAizkir6HviuP04IBflthDBo4WuWaHBnhxS6ZZgHT4m', 1, 'http://localhost:8000/uploads/avatars/avatar_15_6980d528b4489.jpg', 25, 0, '2026-02-02 16:47:10', NULL);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `audit_demandes`
--
ALTER TABLE `audit_demandes`
  ADD CONSTRAINT `fk_audit_demande` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_audit_utilisateur` FOREIGN KEY (`fait_par`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `demandes`
--
ALTER TABLE `demandes`
  ADD CONSTRAINT `fk_demandes_piece` FOREIGN KEY (`piece_jointe_id`) REFERENCES `pieces_jointes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_demandes_traite_par` FOREIGN KEY (`traite_par`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_demandes_type` FOREIGN KEY (`type_id`) REFERENCES `types_conges` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_demandes_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historique_soldes`
--
ALTER TABLE `historique_soldes`
  ADD CONSTRAINT `fk_hist_solde_utilisateur` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `pieces_jointes`
--
ALTER TABLE `pieces_jointes`
  ADD CONSTRAINT `fk_pieces_utilisateurs` FOREIGN KEY (`telecharge_par`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD CONSTRAINT `fk_utilisateurs_manager` FOREIGN KEY (`manager_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_utilisateurs_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
