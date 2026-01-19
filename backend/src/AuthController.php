<?php
// backend/src/AuthController.php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class AuthController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
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

        respondJson([
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ]);
    }
}


