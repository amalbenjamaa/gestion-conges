<?php

require_once __DIR__ . '/Database.php';

class ForgotPasswordController {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    // Étape 1 : Vérifier l'email
    public function verifyEmail(array $input): void {
        $email = $input['email'] ?? '';

        if (empty($email)) {
            respondJson(['error' => 'Email requis'], 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = :email");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if ($user) {
                respondJson(['success' => true, 'message' => 'Email vérifié']);
            } else {
                respondJson(['error' => 'Email non trouvé'], 404);
            }
        } catch (PDOException $e) {
            error_log("ERREUR VERIFY EMAIL: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // Étape 2 : Vérifier le téléphone
    public function verifyPhone(array $input): void {
        $email = $input['email'] ?? '';
        $telephone = $input['telephone'] ?? '';

        if (empty($email) || empty($telephone)) {
            respondJson(['error' => 'Email et téléphone requis'], 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT id FROM utilisateurs 
                WHERE email = :email AND telephone = :telephone
            ");
            $stmt->execute([
                ':email' => $email,
                ':telephone' => $telephone
            ]);
            $user = $stmt->fetch();

            if ($user) {
                respondJson(['success' => true, 'message' => 'Téléphone vérifié']);
            } else {
                respondJson(['error' => 'Téléphone incorrect'], 404);
            }
        } catch (PDOException $e) {
            error_log("ERREUR VERIFY PHONE: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // Étape 3 : Réinitialiser le mot de passe
    public function resetPassword(array $input): void {
        $email = $input['email'] ?? '';
        $telephone = $input['telephone'] ?? '';
        $nouveau_password = $input['nouveau_password'] ?? '';

        if (empty($email) || empty($telephone) || empty($nouveau_password)) {
            respondJson(['error' => 'Tous les champs sont requis'], 400);
            return;
        }

        if (strlen($nouveau_password) < 6) {
            respondJson(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            return;
        }

        try {
            // Vérifier encore une fois l'email et le téléphone
            $stmt = $this->pdo->prepare("
                SELECT id FROM utilisateurs 
                WHERE email = :email AND telephone = :telephone
            ");
            $stmt->execute([
                ':email' => $email,
                ':telephone' => $telephone
            ]);
            $user = $stmt->fetch();

            if (!$user) {
                respondJson(['error' => 'Utilisateur non trouvé'], 404);
                return;
            }

            // Mettre à jour le mot de passe
            $hashedPassword = password_hash($nouveau_password, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("
                UPDATE utilisateurs 
                SET password = :password 
                WHERE id = :id
            ");
            $stmt->execute([
                ':password' => $hashedPassword,
                ':id' => $user['id']
            ]);

            respondJson(['success' => true, 'message' => 'Mot de passe réinitialisé']);
        } catch (PDOException $e) {
            error_log("ERREUR RESET PASSWORD: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}