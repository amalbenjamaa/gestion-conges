<?php
// backend/scripts/create_user.php
// Usage: php backend/scripts/create_user.php
// Crée un utilisateur (employe/manager/admin) avec mot de passe hashé.

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

echo "== Création d'un utilisateur ==\n";

$name = prompt("Nom complet: ");
$email = prompt("Email: ");
$roleName = prompt("Rôle (employe/manager/admin) [employe]: ", "employe");
$vacDays = (int)prompt("Jours de congé alloués (solde_total) [25]: ", "25");

if ($name === '' || $email === '') {
    echo "Nom et email obligatoires.\n";
    exit(1);
}

$stmt = $pdo->prepare("SELECT id FROM roles WHERE nom = ? LIMIT 1");
$stmt->execute([$roleName]);
$role = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$role) {
    echo "Rôle introuvable: $roleName. Rôles existants:\n";
    $all = $pdo->query("SELECT id, nom FROM roles")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($all as $r) echo "  {$r['id']} : {$r['nom']}\n";
    exit(1);
}

$stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo "Erreur : un utilisateur avec cet email existe déjà.\n";
    exit(1);
}

do {
    $password = prompt("Mot de passe (sera hashé) : ");
    $passwordConfirm = prompt("Confirmez le mot de passe : ");
    if ($password !== $passwordConfirm) {
        echo "Les mots de passe ne correspondent pas. Réessayez.\n";
    }
} while ($password !== $passwordConfirm);

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $insert = $pdo->prepare("
        INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
        VALUES (?, ?, ?, ?, ?, 0)
    ");
    $insert->execute([$name, $email, $hash, (int)$role['id'], $vacDays]);
    $id = $pdo->lastInsertId();
    echo "Utilisateur créé avec l'ID = $id (email: $email, rôle: $roleName)\n";
} catch (Exception $e) {
    echo "Erreur lors de l'insertion : " . $e->getMessage() . "\n";
    exit(1);
}

echo "Terminé. Pense à supprimer/protéger ces scripts après usage.\n";


