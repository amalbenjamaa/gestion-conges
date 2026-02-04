<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class PasswordResetController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
        $this->ensureTable();
    }

    private function ensureTable() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS password_reset_codes (
              id INT AUTO_INCREMENT PRIMARY KEY,
              email VARCHAR(200) NOT NULL,
              code VARCHAR(6) NOT NULL,
              reset_token VARCHAR(64) NULL,
              expire_at DATETIME NOT NULL,
              used TINYINT(1) DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (email),
              INDEX (code),
              INDEX (reset_token)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    // Étape 1 : Demander un code de réinitialisation
    public function requestReset($data) {
        $email = trim($data['email'] ?? '');
        
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respondJson(['error' => 'Email invalide'], 400);
            return;
        }

        $user = null;
        try {
            $stmt = $this->pdo->prepare("SELECT id, numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            try {
                $stmt = $this->pdo->prepare("SELECT id, telephone as numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (Exception $e2) {
                $user = null;
            }
        }

        if (!$user) {
            respondJson(['error' => 'Aucun compte associé à cet email'], 404);
            return;
        }

        if (empty($user['numero_telephone'])) {
            respondJson(['error' => 'Aucun numéro de téléphone enregistré pour ce compte'], 400);
            return;
        }

        // Générer un code à 6 chiffres
        $code = str_pad((string)rand(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Expiration : 15 minutes
        $expireAt = date('Y-m-d H:i:s', time() + 900);

        // Supprimer les anciens codes non utilisés pour cet email
        $this->pdo->prepare("DELETE FROM password_reset_codes WHERE email = ? AND used = 0")
            ->execute([$email]);

        // Insérer le nouveau code
        $stmt = $this->pdo->prepare("
            INSERT INTO password_reset_codes (email, code, expire_at) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$email, $code, $expireAt]);

        // Masquer le numéro de téléphone (afficher seulement les 4 derniers chiffres)
        $phone = $user['numero_telephone'];
        $phoneHint = '***' . substr($phone, -4);

        respondJson([
            'success' => true,
            'message' => 'Code généré avec succès',
            'phone_hint' => $phoneHint,
            'code' => $code // ⚠️ EN PRODUCTION : envoyer par SMS, ne pas retourner dans la réponse !
        ]);
    }

    // Étape 2 : Vérifier le téléphone et le code
    public function verifyPhone($data) {
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $code = trim($data['code'] ?? '');

        if (!$email || !$phone || !$code) {
            respondJson(['error' => 'Email, téléphone et code requis'], 400);
            return;
        }

        // Vérifier que l'email et le téléphone correspondent
        $user = null;
        try {
            $stmt = $this->pdo->prepare("SELECT id, numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            try {
                $stmt = $this->pdo->prepare("SELECT id, telephone as numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (Exception $e2) {
                $user = null;
            }
        }

        if (!$user) {
            respondJson(['error' => 'Email invalide'], 404);
            return;
        }

        // Vérifier que le téléphone correspond
        if ($user['numero_telephone'] !== $phone) {
            respondJson(['error' => 'Le numéro de téléphone ne correspond pas à cet email'], 403);
            return;
        }

        // Vérifier le code
        $stmt = $this->pdo->prepare("
            SELECT id 
            FROM password_reset_codes 
            WHERE email = ? 
            AND code = ? 
            AND used = 0 
            AND expire_at > NOW()
        ");
        $stmt->execute([$email, $code]);
        $resetCode = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$resetCode) {
            respondJson(['error' => 'Code invalide ou expiré'], 403);
            return;
        }

        // Générer un token de réinitialisation
        $resetToken = bin2hex(random_bytes(32));

        // Mettre à jour le code avec le token
        $stmt = $this->pdo->prepare("
            UPDATE password_reset_codes 
            SET reset_token = ? 
            WHERE id = ?
        ");
        $stmt->execute([$resetToken, $resetCode['id']]);

        respondJson([
            'success' => true,
            'reset_token' => $resetToken
        ]);
    }

    // Étape 3 : Réinitialiser le mot de passe
    public function resetPassword($data) {
        $resetToken = trim($data['reset_token'] ?? '');
        $newPassword = trim($data['new_password'] ?? '');

        if (!$resetToken || !$newPassword) {
            respondJson(['error' => 'Token et nouveau mot de passe requis'], 400);
            return;
        }

        if (strlen($newPassword) < 6) {
            respondJson(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            return;
        }

        // Vérifier le token
        $stmt = $this->pdo->prepare("
            SELECT id, email 
            FROM password_reset_codes 
            WHERE reset_token = ? 
            AND used = 0 
            AND expire_at > NOW()
        ");
        $stmt->execute([$resetToken]);
        $resetCode = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$resetCode) {
            respondJson(['error' => 'Token invalide ou expiré'], 403);
            return;
        }

        // Hasher le nouveau mot de passe
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        // Mettre à jour le mot de passe
        $stmt = $this->pdo->prepare("
            UPDATE utilisateurs 
            SET mot_de_passe = ? 
            WHERE LOWER(email) = LOWER(?)
        ");
        $stmt->execute([$hashedPassword, $resetCode['email']]);

        // Marquer le code comme utilisé
        $stmt = $this->pdo->prepare("
            UPDATE password_reset_codes 
            SET used = 1 
            WHERE id = ?
        ");
        $stmt->execute([$resetCode['id']]);

        respondJson([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès'
        ]);
    }
}
