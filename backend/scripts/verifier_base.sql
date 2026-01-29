-- Script pour vérifier l'état de la base de données
-- Usage: mysql -u root -p gestion_conges < backend/scripts/verifier_base.sql

USE gestion_conges;

SELECT '=== VÉRIFICATION DE LA BASE DE DONNÉES ===' as '';
SELECT '' as '';

-- Vérifier les rôles
SELECT 'Rôles disponibles:' as '';
SELECT id, nom, cree_le FROM roles;
SELECT '' as '';

-- Vérifier les types de congés
SELECT 'Types de congés disponibles:' as '';
SELECT id, nom, piece_jointe_requise, couleur FROM types_conges;
SELECT '' as '';

-- Compter les utilisateurs
SELECT 'Nombre d\'utilisateurs:' as '';
SELECT COUNT(*) as total_utilisateurs FROM utilisateurs;
SELECT '' as '';

-- Liste des utilisateurs
SELECT 'Liste des utilisateurs:' as '';
SELECT 
    u.id,
    u.nom_complet,
    u.email,
    r.nom as role,
    u.solde_total as quota_annuel,
    u.solde_consomme as consomme,
    (u.solde_total - u.solde_consomme) as solde_restant
FROM utilisateurs u
JOIN roles r ON r.id = u.role_id
ORDER BY u.id;
SELECT '' as '';

-- Statistiques
SELECT 'Statistiques:' as '';
SELECT 
    (SELECT COUNT(*) FROM utilisateurs WHERE role_id = 1) as nb_employes,
    (SELECT COUNT(*) FROM utilisateurs WHERE role_id = 2) as nb_managers,
    (SELECT COUNT(*) FROM demandes) as nb_demandes,
    (SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente') as demandes_en_attente,
    (SELECT COUNT(*) FROM demandes WHERE statut = 'validee') as demandes_validees;
SELECT '' as '';

SELECT '=== VÉRIFICATION TERMINÉE ===' as '';



