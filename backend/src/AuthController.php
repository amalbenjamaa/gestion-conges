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
            SELECT u.id, u.email, u.mot_de_passe, u.role_id, r.nom AS role
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE LOWER(u.email) = LOWER(?)
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
        $_SESSION['role_id'] = (int)$user['role_id'];

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
    try {
        error_log("=== ME REQUEST ===");
        
        if (!isset($_SESSION['user_id'])) {
            error_log("❌ Non authentifié");
            respondJson(['error' => 'Non authentifié'], 401);
            return;
        }
        
        $userId = $_SESSION['user_id'];
        error_log("User ID: $userId");
        error_log("Role ID in session: " . ($_SESSION['role_id'] ?? 'NON DÉFINI'));
        
        // ✅ Récupérer les soldes aussi
        $sql = "SELECT 
                    id, 
                    email, 
                    nom_complet, 
                    role_id,
                    solde_total,
                    solde_consomme,
                    (solde_total - solde_consomme) as solde_restant,
                    avatar_url,
                    position
                FROM utilisateurs 
                WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            error_log("❌ Utilisateur non trouvé");
            respondJson(['error' => 'Utilisateur non trouvé'], 404);
            return;
        }
        
        // ✅ Mettre à jour la session
        $_SESSION['role_id'] = $user['role_id'];
        
        error_log("✅ User trouvé: {$user['email']}, Role ID: {$user['role_id']}");
        
        $roleLabel = match ((int)$user['role_id']) {
            2 => 'manager',
            3 => 'admin',
            default => 'employe',
        };

        respondJson([
            'id' => $user['id'],
            'email' => $user['email'],
            'nom_complet' => $user['nom_complet'],
            'role_id' => $user['role_id'],
            'role' => $roleLabel,
            'solde_total' => (int)$user['solde_total'],
            'solde_consomme' => (int)$user['solde_consomme'],
            'solde_restant' => (int)$user['solde_restant'],
            'avatar_url' => $user['avatar_url'],
            'position' => $user['position']
        ]);
        
    } catch (Exception $e) {
        error_log("❌ Erreur me: " . $e->getMessage());
        respondJson(['error' => 'Erreur serveur'], 500);
    }
}

    // POST /api/me/avatar (multipart/form-data: avatar=file)
    public function uploadAvatar(): void {
        if (empty($_SESSION['user_id'])) {
            respondJson(['error' => 'Non authentifié'], 401);
        }
        $userId = (int)$_SESSION['user_id'];

        if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            respondJson(['error' => 'Fichier avatar manquant'], 422);
        }

        $tmp = $_FILES['avatar']['tmp_name'];
        $mime = mime_content_type($tmp) ?: '';
        if (strpos($mime, 'image/') !== 0) {
            respondJson(['error' => 'Le fichier doit être une image'], 422);
        }

        $ext = pathinfo($_FILES['avatar']['name'] ?? '', PATHINFO_EXTENSION);
        $ext = strtolower($ext);
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            $ext = str_replace('image/', '', $mime);
            if ($ext === 'jpeg') $ext = 'jpg';
        }

        $dir = __DIR__ . '/../public/uploads/avatars';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $filename = 'avatar_' . $userId . '_' . uniqid() . '.' . $ext;
        $destPath = $dir . '/' . $filename;
        if (!move_uploaded_file($tmp, $destPath)) {
            respondJson(['error' => "Impossible d'enregistrer l'image"], 500);
        }

        $avatarUrl = app_public_base_url() . '/uploads/avatars/' . $filename;
        $stmt = $this->pdo->prepare("UPDATE utilisateurs SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);

        respondJson(['ok' => true, 'avatar_url' => $avatarUrl]);
    }
}
?>
