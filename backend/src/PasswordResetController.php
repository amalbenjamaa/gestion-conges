<?php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class PasswordResetController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
        $this->ensureTable();
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /** Chiffres uniquement ; +33xxxxxxxxxx → 0xxxxxxxxxx (France) */
    private function normalizePhoneDigits(?string $phone): string
    {
        if ($phone === null || $phone === '') {
            return '';
        }
        $d = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($d, '33') && strlen($d) >= 10) {
            $d = '0' . substr($d, 2);
        }

        return $d;
    }

    /** Récupère le téléphone (colonne numero_telephone ou telephone selon schéma). */
    private function findUserPhoneByEmail(string $emailNorm): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT id, numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)
        ');
        $stmt->execute([$emailNorm]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user && !empty(trim((string)($user['numero_telephone'] ?? '')))) {
            return ['id' => $user['id'], 'phone' => trim((string)$user['numero_telephone'])];
        }
        try {
            $stmt = $this->pdo->prepare('
                SELECT id, telephone AS numero_telephone FROM utilisateurs WHERE LOWER(email) = LOWER(?)
            ');
            $stmt->execute([$emailNorm]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user && !empty(trim((string)($user['numero_telephone'] ?? '')))) {
                return ['id' => $user['id'], 'phone' => trim((string)$user['numero_telephone'])];
            }
        } catch (Throwable $e) {
            // colonne telephone absente
        }

        return null;
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
        $emailRaw = trim($data['email'] ?? '');
        $email = $this->normalizeEmail($emailRaw);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respondJson(['error' => 'Email invalide'], 400);
            return;
        }

        $stmt = $this->pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?)');
        $stmt->execute([$email]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            respondJson(['error' => 'Aucun compte associé à cet email'], 404);
            return;
        }

        $user = $this->findUserPhoneByEmail($email);

        if (!$user) {
            respondJson(['error' => 'Aucun numéro de téléphone enregistré pour ce compte'], 400);
            return;
        }

        // Générer un code à 6 chiffres
        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Supprimer les anciens codes non utilisés pour cet email (toujours stocker l’email en minuscules)
        $this->pdo->prepare('DELETE FROM password_reset_codes WHERE LOWER(email) = ? AND used = 0')
            ->execute([$email]);

        // Expiration côté MySQL (évite décalage fuseau PHP / serveur)
        $stmt = $this->pdo->prepare('
            INSERT INTO password_reset_codes (email, code, expire_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
        ');
        $stmt->execute([$email, $code]);

        // Masquer le numéro de téléphone (afficher seulement les 4 derniers chiffres)
        $digits = $this->normalizePhoneDigits($user['phone']);
        $phoneHint = strlen($digits) >= 4 ? '***' . substr($digits, -4) : '****';

        respondJson([
            'success' => true,
            'message' => 'Code généré avec succès',
            'phone_hint' => $phoneHint,
            'code' => $code // ⚠️ EN PRODUCTION : envoyer par SMS, ne pas retourner dans la réponse !
        ]);
    }

    // Étape 2 : Vérifier le téléphone et le code
    public function verifyPhone($data) {
        $email = $this->normalizeEmail(trim($data['email'] ?? ''));
        $phone = trim($data['phone'] ?? '');
        $codeRaw = preg_replace('/\D+/', '', trim($data['code'] ?? ''));

        if (!$email || !$phone || $codeRaw === '') {
            respondJson(['error' => 'Email, téléphone et code requis'], 400);
            return;
        }

        $stmt = $this->pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?)');
        $stmt->execute([$email]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            respondJson(['error' => 'Email invalide'], 404);
            return;
        }

        $user = $this->findUserPhoneByEmail($email);

        if (!$user) {
            respondJson(['error' => 'Aucun numéro de téléphone enregistré pour ce compte'], 400);
            return;
        }

        $dbPhone = $this->normalizePhoneDigits($user['phone']);
        $inPhone = $this->normalizePhoneDigits($phone);
        if ($dbPhone === '' || $dbPhone !== $inPhone) {
            respondJson(['error' => 'Le numéro de téléphone ne correspond pas à cet email'], 403);
            return;
        }

        if (strlen($codeRaw) > 6) {
            $codeRaw = substr($codeRaw, -6);
        } elseif (strlen($codeRaw) < 6) {
            $codeRaw = str_pad($codeRaw, 6, '0', STR_PAD_LEFT);
        }
        $code = $codeRaw;

        // Même email normalisé (minuscules) qu’à l’insertion
        $stmt = $this->pdo->prepare('
            SELECT id
            FROM password_reset_codes
            WHERE LOWER(email) = ?
            AND code = ?
            AND used = 0
            AND expire_at > NOW()
        ');
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
