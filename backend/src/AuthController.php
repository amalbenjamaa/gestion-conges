<?php
class AuthController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login($data) {
        $email = $data['email'] ?? '';

        error_log("Tentative de connexion - Email: $email");

        if (!$email) {
            respondJson(['error' => 'Email requis'], 400);
            return;
        }

        // Récupérer l'utilisateur avec son avatar
        $stmt = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            error_log("Utilisateur non trouvé: $email");
            respondJson(['error' => 'Utilisateur non trouvé'], 404);
            return;
        }

        error_log("Connexion acceptée pour: $email (role: {$user['role_id']})");

        // Créer la session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role_id'];

        respondJson([
            'ok' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'nom_complet' => $user['nom_complet'],
                'role_id' => $user['role_id'],
                'avatar_url' => $user['avatar_url'],
                'solde_total' => $user['solde_total'],
                'solde_consomme' => $user['solde_consomme']
            ]
        ]);
    }

    public function logout() {
        session_start();
        session_destroy();
        respondJson(['ok' => true, 'message' => 'Déconnexion réussie']);
    }
}