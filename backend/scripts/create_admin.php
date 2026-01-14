<?php
// backend/scripts/create_admin.php
// Usage: php backend/scripts/create_admin.php
// Lit backend/config.ini pour la connexion DB, demande les infos en CLI,
// vérifie le rôle 'admin' (id=3) et crée l'utilisateur admin.

ini_set('display_errors', 1);
error_reporting(E_ALL);

$configPath = __DIR__ . '/../config.ini';
if (!file_exists($configPath)) {
    echo "Erreur: fichier de configuration non trouvé: $configPath\n";
    exit(1);
}

$cfg = parse_ini_file($configPath);
$dsn = "mysql:host={$cfg['DB_HOST']};dbname={$cfg['DB_NAME']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $cfg['DB_USER'], $cfg['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Exception $e) {
    echo "Erreur de connexion à la base : " . $e->getMessage() . "\n";
    exit(1);
}

function prompt($msg, $default = '') {
    echo $msg;
    $handle = fopen("php://stdin", "r");
    $line = trim(fgets($handle));
    if ($line === '') return $default;
    return $line;
}

echo "== Création d'un compte administrateur ==\n";

// Vérifier que la table roles contient un rôle admin avec id = 3
try {
    $stmt = $pdo->prepare("SELECT id, nom FROM roles WHERE id = 3");
    $stmt->execute();
    $role = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$role) {
        echo "Avertissement : aucun rôle avec id=3 trouvé dans la table roles.\n";
        echo "Les rôles actuels :\n";
        $all = $pdo->query("SELECT id, nom FROM roles")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($all as $r) {
            echo "  {$r['id']} : {$r['nom']}\n";
        }
        $create = prompt("Voulez-vous insérer le rôle (3, 'admin') automatiquement ? (o/n) [o]: ", "o");
        if (strtolower($create) === 'o' || strtolower($create) === 'oui') {
            $pdo->exec("INSERT IGNORE INTO roles (id, nom) VALUES (3, 'admin')");
            echo "Rôle admin inséré.\n";
        } else {
            echo "Interrompu : crée d'abord le rôle admin dans la table roles.\n";
            exit(1);
        }
    }
} catch (Exception $e) {
    echo "Erreur lors de la vérification des rôles : " . $e->getMessage() . "\n";
    exit(1);
}

$name = prompt("Nom complet [Admin Principal]: ", "Admin Principal");
$email = prompt("Email [admin@entreprise.com]: ", "admin@entreprise.com");

// Vérifier si l'email existe déjà
$stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo "Erreur : un utilisateur avec cet email existe déjà. Utilisez un autre email ou supprimez l'utilisateur existant.\n";
    exit(1);
}

// Mot de passe (double saisie)
do {
    $password = prompt("Mot de passe (sera hashé) : ");
    $passwordConfirm = prompt("Confirmez le mot de passe : ");
    if ($password !== $passwordConfirm) {
        echo "Les mots de passe ne correspondent pas. Réessayez.\n";
    }
} while ($password !== $passwordConfirm);

$vacDays = prompt("Jours de congé alloués (solde_total) [30]: ", "30");

$hash = password_hash($password, PASSWORD_DEFAULT);

// Inserer dans la table utilisateurs (colonnes selon ton schema)
try {
    $insert = $pdo->prepare("
        INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
        VALUES (?, ?, ?, ?, ?, 0)
    ");
    $insert->execute([$name, $email, $hash, 3, (int)$vacDays]);
    $id = $pdo->lastInsertId();
    echo "Administrateur créé avec l'ID = $id (email: $email)\n";
} catch (Exception $e) {
    echo "Erreur lors de l'insertion : " . $e->getMessage() . "\n";
    exit(1);
}

echo "Terminé. Pense à supprimer ce script ou le protéger après usage.\n";