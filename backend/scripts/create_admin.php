<?php
// backend/scripts/create_admin.php
// Crée un utilisateur "manager" (anciennement create_admin)

$config = parse_ini_file(__DIR__ . '/../config.ini', true);
if (!$config) { echo "Impossible de lire config.ini\n"; exit(1); }
$db = $config['database'];
$dsn = sprintf('mysql:host=%s;dbname=%s;port=%s;charset=utf8mb4', $db['DB_HOST'], $db['DB_NAME'], $db['DB_PORT'] ?? 3306);

try {
    $pdo = new PDO($dsn, $db['DB_USER'], $db['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) {
    echo "Erreur connexion DB: ".$e->getMessage()."\n"; exit(1);
}

// S'assurer que 'manager' existe
$stmt = $pdo->prepare("SELECT id FROM roles WHERE nom = 'manager' LIMIT 1");
$stmt->execute();
$role = $stmt->fetch();
if (!$role) {
    $pdo->prepare("INSERT INTO roles (nom) VALUES ('manager')")->execute();
    $roleId = $pdo->lastInsertId();
    echo "Role 'manager' créé (id={$roleId}).\n";
} else {
    $roleId = $role['id'];
    echo "Role 'manager' existe (id={$roleId}).\n";
}

// Demande info
function ask($p) { echo $p; return trim(fgets(STDIN)); }
$email = ask("Email: ");
$nom = ask("Nom complet: ");
$password = ask("Mot de passe (>=6): ");
if (strlen($password) < 6) { echo "Mot de passe trop court\n"; exit(1); }
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id) VALUES (?, ?, ?, ?)");
try {
    $stmt->execute([$nom, $email, $hash, $roleId]);
    echo "Manager créé. ID: ".$pdo->lastInsertId()."\n";
} catch (Exception $e) {
    echo "Erreur: ".$e->getMessage()."\n";
}