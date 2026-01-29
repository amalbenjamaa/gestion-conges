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
        $password = $data['password'] ?? '';

        // Log pour déboguer
        error_log("Tentative de connexion - Email: $email");

        if (!$email) {
            respondJson(['error' => 'Email requis'], 400);
            return;
        }

        // Récupérer l'utilisateur
        $stmt = $this->pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            error_log("Utilisateur non trouvé: $email");
            respondJson(['error' => 'Utilisateur non trouvé'], 404);
            return;
        }

        // Log pour voir si le mot de passe est hashé ou non
        error_log("Mot de passe en BDD: " . $user['mot_de_passe']);
        error_log("Mot de passe saisi: $password");

        // VÉRIFICATION DU MOT DE PASSE
        // Si le mot de passe en BDD est vide ou NULL, accepter directement
        if (empty($user['mot_de_passe'])) {
            error_log("Connexion sans mot de passe acceptée pour: $email");
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
                    'role_id' => $user['role_id']
                ]
            ]);
            return;
        }

        // Si le mot de passe en BDD commence par '$2y$', c'est un hash bcrypt
        if (strpos($user['mot_de_passe'], '$2y$') === 0) {
            // Vérifier avec password_verify
            if (!password_verify($password, $user['mot_de_passe'])) {
                error_log("Mot de passe hashé incorrect pour: $email");
                respondJson(['error' => 'Mot de passe incorrect'], 401);
                return;
            }
        } else {
            // Mot de passe en clair (pour le développement)
            if ($password !== $user['mot_de_passe']) {
                error_log("Mot de passe en clair incorrect pour: $email");
                respondJson(['error' => 'Mot de passe incorrect'], 401);
                return;
            }
        }

        error_log("Connexion réussie pour: $email");

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
                'role_id' => $user['role_id']
            ]
        ]);
    }

    public function logout() {
        session_start();
        session_destroy();
        respondJson(['ok' => true, 'message' => 'Déconnexion réussie']);
    }
}