<?php
// backend/src/AuthController.php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class AuthController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    // POST /api/login
    // Body JSON: { "email": "...", "password": "..." }
    public function login($data) {
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if ($email === '' || $password === '') {
            respondJson(['error' => 'Email et mot de passe requis'], 400);
        }

        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.mot_de_passe, r.nom AS role
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.email = ?
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Ne jamais leak si l'email existe ou non : réponse identique
        if (!$user || empty($user['mot_de_passe']) || !password_verify($password, $user['mot_de_passe'])) {
            respondJson(['error' => 'Identifiants invalides'], 401);
        }

        // Auth ok -> créer session
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];

        respondJson([
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
    }

    // POST /api/logout
    public function logout() {
        // détruire la session
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        respondJson(['ok' => true]);
    }

    // GET /api/me
    public function me() {
        if (empty($_SESSION['user_id'])) {
            respondJson(['error' => 'Non authentifié'], 401);
        }
        $userId = (int)$_SESSION['user_id'];
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.nom_complet, u.email, u.position, u.avatar_url, u.solde_total, u.solde_consomme, r.nom AS role
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$u) {
            respondJson(['error' => 'Utilisateur introuvable'], 404);
        }
        $soldeTotal = (int)$u['solde_total'];
        $soldeConsomme = (int)$u['solde_consomme'];
        $soldeRestant = max(0, $soldeTotal - $soldeConsomme);

        respondJson([
            'id' => (int)$u['id'],
            'email' => $u['email'],
            'role' => $u['role'],
            'nom_complet' => $u['nom_complet'],
            'position' => $u['position'],
            'avatar_url' => $u['avatar_url'],
            'solde_total' => $soldeTotal,
            'solde_consomme' => $soldeConsomme,
            'solde_restant' => $soldeRestant,
        ]);
    }
}
?>
