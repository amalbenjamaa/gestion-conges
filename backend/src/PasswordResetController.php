<?php

class PasswordResetController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    /**
     * Étape 1 : Demande de réinitialisation
     * Génère un code à 6 chiffres et retourne un indice du téléphone
     */
    public function requestReset($data) {
        $email = $data['email'] ?? '';

        if (empty($email)) {
            respondJson(['error' => 'Email requis'], 400);
            return;
        }

        try {
            // Vérifier que l'email existe et récupérer le numéro de téléphone
            $stmt = $this->pdo->prepare("
                SELECT id, numero_telephone 
                FROM utilisateurs 
                WHERE email = ?
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                respondJson(['error' => 'Email non trouvé'], 404);
                return;
            }

            if (empty($user['numero_telephone'])) {
                respondJson(['error' => 'Aucun numéro de téléphone associé à ce compte'], 400);
                return;
            }

            // Vérifier le rate limiting (max 5 demandes par heure)
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count 
                FROM password_reset_codes 
                WHERE email = ? 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            $stmt->execute([$email]);
            $rateLimit = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($rateLimit['count'] >= 5) {
                respondJson(['error' => 'Trop de tentatives. Réessayez dans une heure.'], 429);
                return;
            }

            // Générer un code à 6 chiffres
            $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

            // Date d'expiration (15 minutes)
            $expireAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Stocker le code
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
                'message' => 'Code envoyé',
                'phone_hint' => $phoneHint
            ]);
        } catch (PDOException $e) {
            error_log("Erreur requestReset: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Étape 2 : Vérification du téléphone et du code
     * Génère un token de réinitialisation
     */
    public function verifyPhone($data) {
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $code = $data['code'] ?? '';

        if (empty($email) || empty($phone) || empty($code)) {
            respondJson(['error' => 'Email, téléphone et code requis'], 400);
            return;
        }

        try {
            // Vérifier que l'email et le téléphone correspondent
            $stmt = $this->pdo->prepare("
                SELECT id 
                FROM utilisateurs 
                WHERE email = ? AND numero_telephone = ?
            ");
            $stmt->execute([$email, $phone]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                respondJson(['error' => 'Numéro de téléphone incorrect'], 404);
                return;
            }

            // Vérifier le code
            $stmt = $this->pdo->prepare("
                SELECT id, expire_at, used 
                FROM password_reset_codes 
                WHERE email = ? AND code = ?
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$email, $code]);
            $resetCode = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$resetCode) {
                respondJson(['error' => 'Code invalide'], 404);
                return;
            }

            if ($resetCode['used']) {
                respondJson(['error' => 'Ce code a déjà été utilisé'], 400);
                return;
            }

            // Vérifier l'expiration
            $now = date('Y-m-d H:i:s');
            if ($now > $resetCode['expire_at']) {
                respondJson(['error' => 'Code expiré. Veuillez demander un nouveau code.'], 400);
                return;
            }

            // Générer un token de réinitialisation
            $resetToken = bin2hex(random_bytes(32));

            // Mettre à jour le code avec le token
            $stmt = $this->pdo->prepare("
                UPDATE password_reset_codes 
                SET reset_token = ?, used = 1 
                WHERE id = ?
            ");
            $stmt->execute([$resetToken, $resetCode['id']]);

            respondJson([
                'success' => true,
                'reset_token' => $resetToken
            ]);
        } catch (PDOException $e) {
            error_log("Erreur verifyPhone: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Étape 3 : Réinitialisation du mot de passe
     * Utilise le token pour mettre à jour le mot de passe
     */
    public function resetPassword($data) {
        $resetToken = $data['reset_token'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (empty($resetToken) || empty($newPassword)) {
            respondJson(['error' => 'Token et nouveau mot de passe requis'], 400);
            return;
        }

        if (strlen($newPassword) < 6) {
            respondJson(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            return;
        }

        try {
            // Vérifier le token
            $stmt = $this->pdo->prepare("
                SELECT email 
                FROM password_reset_codes 
                WHERE reset_token = ? AND used = 1
            ");
            $stmt->execute([$resetToken]);
            $resetCode = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$resetCode) {
                respondJson(['error' => 'Token invalide ou expiré'], 404);
                return;
            }

            // Mettre à jour le mot de passe
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $this->pdo->prepare("
                UPDATE utilisateurs 
                SET mot_de_passe = ? 
                WHERE email = ?
            ");
            $stmt->execute([$hashedPassword, $resetCode['email']]);

            // Invalider tous les codes de réinitialisation pour cet email
            $stmt = $this->pdo->prepare("
                DELETE FROM password_reset_codes 
                WHERE email = ?
            ");
            $stmt->execute([$resetCode['email']]);

            respondJson([
                'success' => true,
                'message' => 'Mot de passe modifié'
            ]);
        } catch (PDOException $e) {
            error_log("Erreur resetPassword: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Nettoie les codes expirés (peut être appelé périodiquement)
     */
    public function cleanExpiredCodes() {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM password_reset_codes 
                WHERE expire_at < NOW()
            ");
            $stmt->execute();
            
            respondJson([
                'success' => true,
                'message' => 'Codes expirés supprimés'
            ]);
        } catch (PDOException $e) {
            error_log("Erreur cleanExpiredCodes: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}
