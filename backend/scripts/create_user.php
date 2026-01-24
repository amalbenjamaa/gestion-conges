<?php
/**
 * Script pour créer un utilisateur dans la base de données
 * Usage: php backend/scripts/create_user.php
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Création d'un utilisateur ===\n\n";

// Lire les informations
echo "Nom complet: ";
$nom_complet = trim(fgets(STDIN));

echo "Email: ";
$email = trim(fgets(STDIN));

echo "Mot de passe: ";
$password = trim(fgets(STDIN));

echo "Rôle (1 = employe, 2 = manager): ";
$role_id = (int)trim(fgets(STDIN));
if ($role_id !== 1 && $role_id !== 2) {
    echo "Erreur: Le rôle doit être 1 (employe) ou 2 (manager)\n";
    exit(1);
}

echo "Quota annuel (jours): ";
$solde_total = (int)trim(fgets(STDIN));
if ($solde_total < 0) {
    echo "Erreur: Le quota ne peut pas être négatif\n";
    exit(1);
}

echo "Jours déjà consommés: ";
$solde_consomme = (int)trim(fgets(STDIN));
if ($solde_consomme < 0) {
    echo "Erreur: Les jours consommés ne peuvent pas être négatifs\n";
    exit(1);
}

// Hash du mot de passe
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo = Database::getPdo();
    
    // Vérifier que l'email n'existe pas déjà
    $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Erreur: Cet email est déjà utilisé\n";
        exit(1);
    }
    
    // Vérifier que le rôle existe
    $stmt = $pdo->prepare("SELECT id FROM roles WHERE id = ?");
    $stmt->execute([$role_id]);
    if (!$stmt->fetch()) {
        echo "Erreur: Le rôle spécifié n'existe pas\n";
        exit(1);
    }
    
    // Insérer l'utilisateur
    $stmt = $pdo->prepare("
        INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$nom_complet, $email, $hash, $role_id, $solde_total, $solde_consomme]);
    
    $id = $pdo->lastInsertId();
    
    // Récupérer le nom du rôle
    $stmt = $pdo->prepare("SELECT nom FROM roles WHERE id = ?");
    $stmt->execute([$role_id]);
    $role = $stmt->fetchColumn();
    
    echo "\n✅ Utilisateur créé avec succès !\n\n";
    echo "ID: $id\n";
    echo "Nom: $nom_complet\n";
    echo "Email: $email\n";
    echo "Rôle: $role\n";
    echo "Quota annuel: $solde_total jours\n";
    echo "Jours consommés: $solde_consomme jours\n";
    echo "Solde restant: " . ($solde_total - $solde_consomme) . " jours\n\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
