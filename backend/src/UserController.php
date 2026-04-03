<?php
class UserController {
    private $pdo;
    /** @var array<string, array<string, bool>> */
    private static $columnCache = [];

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    private function columnExists(string $table, string $column): bool {
        if (!isset(self::$columnCache[$table])) {
            self::$columnCache[$table] = [];
        }
        if (array_key_exists($column, self::$columnCache[$table])) {
            return self::$columnCache[$table][$column];
        }
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $stmt->execute([$table, $column]);
        $ok = (int)$stmt->fetchColumn() > 0;
        self::$columnCache[$table][$column] = $ok;
        return $ok;
    }

    public function createUser($data) {
        $nom_complet = $data['nom_complet'] ?? '';
        $email = $data['email'] ?? '';
        $role_id = $data['role_id'] ?? 1;
        $solde_total = $data['solde_total'] ?? 30;
        $plainPassword = $data['password'] ?? ($data['mot_de_passe'] ?? null);
        $telephone = $data['telephone'] ?? ($data['numero_telephone'] ?? null);
        $telephone = is_string($telephone) ? trim($telephone) : $telephone;
        if ($telephone === '') {
            $telephone = null;
        }
        $position = isset($data['position']) ? trim((string)$data['position']) : null;
        if ($position === '') {
            $position = null;
        }
        $bureau = isset($data['bureau']) ? trim((string)$data['bureau']) : null;
        if ($bureau === '') {
            $bureau = null;
        }

        if (!$nom_complet || !$email) {
            respondJson(['error' => 'Nom et email requis'], 400);
            return;
        }

        // Vérifier si l'email existe déjà
        $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            respondJson(['error' => 'Cet email existe déjà'], 409);
            return;
        }

        // Hasher le mot de passe si fourni
        $hashedPassword = null;
        if ($plainPassword) {
            $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
        }

        // Colonnes téléphone : selon migrations (telephone OU numero_telephone)
        $hasTelephone = $this->columnExists('utilisateurs', 'telephone');
        $hasNumeroTel = $this->columnExists('utilisateurs', 'numero_telephone');
        $hasBureau = $this->columnExists('utilisateurs', 'bureau');
        $hasPosition = $this->columnExists('utilisateurs', 'position');

        $cols = ['nom_complet', 'email', 'mot_de_passe', 'role_id', 'solde_total', 'solde_consomme'];
        $vals = [$nom_complet, $email, $hashedPassword, $role_id, $solde_total, 0];
        if ($hasTelephone) {
            $cols[] = 'telephone';
            $vals[] = $telephone;
        }
        if ($hasNumeroTel) {
            $cols[] = 'numero_telephone';
            $vals[] = $telephone;
        }
        if ($hasPosition) {
            $cols[] = 'position';
            $vals[] = $position;
        }
        if ($hasBureau) {
            $cols[] = 'bureau';
            $vals[] = $bureau;
        }

        $placeholders = implode(', ', array_fill(0, count($cols), '?'));
        $sql = 'INSERT INTO utilisateurs (' . implode(', ', $cols) . ') VALUES (' . $placeholders . ')';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($vals);

        respondJson([
            'id' => $this->pdo->lastInsertId(),
            'nom_complet' => $nom_complet,
            'email' => $email,
            'role_id' => $role_id,
            'telephone' => $telephone,
            'numero_telephone' => $telephone,
            'position' => $position,
            'bureau' => $bureau,
        ], 201);
    }

    public function getAllUsers() {
        $stmt = $this->pdo->query("
            SELECT id, nom_complet, email, role_id, solde_total, solde_consomme, avatar_url 
            FROM utilisateurs 
            ORDER BY nom_complet
        ");
        $users = $stmt->fetchAll();
        respondJson(['users' => $users]);
    }

    // ✅ LISTE DES EMPLOYÉS POUR LE DASHBOARD
    public function getEmployes() {
    try {
        error_log("=== GET EMPLOYES ===");
        
        $telExpr = 'NULL';
        if ($this->columnExists('utilisateurs', 'telephone') && $this->columnExists('utilisateurs', 'numero_telephone')) {
            $telExpr = 'COALESCE(NULLIF(TRIM(u.telephone), \'\'), NULLIF(TRIM(u.numero_telephone), \'\'))';
        } elseif ($this->columnExists('utilisateurs', 'telephone')) {
            $telExpr = 'NULLIF(TRIM(u.telephone), \'\')';
        } elseif ($this->columnExists('utilisateurs', 'numero_telephone')) {
            $telExpr = 'NULLIF(TRIM(u.numero_telephone), \'\')';
        }
        $sql = "
            SELECT 
                u.id,
                u.nom_complet,
                u.email,
                u.solde_total,
                u.solde_consomme,
                (u.solde_total - u.solde_consomme) as solde_restant,
                u.avatar_url,
                u.position,
                {$telExpr} AS telephone,
                {$telExpr} AS numero_telephone,
                -- Vérifier si l'employé est en congé aujourd'hui
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM demandes d 
                        WHERE d.utilisateur_id = u.id 
                        AND d.statut = 'validee'
                        AND CURDATE() BETWEEN d.date_debut AND d.date_fin
                    ) THEN 1
                    ELSE 0
                END as est_en_conge
            FROM utilisateurs u
            WHERE u.role_id = 1
            ORDER BY u.nom_complet
        ";
        
        $stmt = $this->pdo->query($sql);
        $employes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("✅ Employés trouvés: " . count($employes));
        
        respondJson(['employes' => $employes]);
        
    } catch (Exception $e) {
        error_log("❌ Erreur getEmployes: " . $e->getMessage());
        respondJson(['error' => 'Erreur serveur'], 500);
    }
}

    // ✅ CALENDRIER - Demandes validées de l'utilisateur connecté
    public function getCalendarEvents() {
        try {
            error_log("=== GET CALENDAR EVENTS ===");
            
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }
            
            $userId = $_SESSION['user_id'];
            error_log("User ID: $userId");
            
            $sql = "
                SELECT 
                    d.id,
                    d.date_debut,
                    d.date_fin,
                    d.motif,
                    tc.nom as type_conge,
                    tc.couleur as type_couleur,
                    u.nom_complet
                FROM demandes d
                LEFT JOIN types_conges tc ON d.type_id = tc.id
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id
                WHERE d.utilisateur_id = ? 
                AND d.statut = 'validee'
                ORDER BY d.date_debut DESC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("✅ Events trouvés: " . count($events));
            
            respondJson(['events' => $events]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur getCalendarEvents: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // ✅ CALENDRIER - TOUTES les demandes validées (pour managers)
    public function getAllCalendarEvents() {
        try {
            error_log("=== GET ALL CALENDAR EVENTS ===");
            
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }
            
            // Manager ou admin
            $rid = isset($_SESSION['role_id']) ? (int)$_SESSION['role_id'] : 0;
            if (!in_array($rid, [2, 3], true)) {
                error_log("❌ Non autorisé - Role: " . ($_SESSION['role_id'] ?? 'aucun'));
                respondJson(['error' => 'Non autorisé'], 403);
                return;
            }
            
            $sql = "
                SELECT 
                    d.id,
                    d.date_debut,
                    d.date_fin,
                    d.motif,
                    tc.nom as type_conge,
                    tc.couleur as type_couleur,
                    u.nom_complet
                FROM demandes d
                LEFT JOIN types_conges tc ON d.type_id = tc.id
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id
                WHERE d.statut = 'validee'
                ORDER BY d.date_debut DESC
            ";
            
            $stmt = $this->pdo->query($sql);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("✅ Events trouvés: " . count($events));
            
            respondJson(['events' => $events]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur getAllCalendarEvents: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    private function assertManagerOrAdmin(): void {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        if (empty($_SESSION['user_id'])) {
            respondJson(['error' => 'Non authentifié'], 401);
        }
        $role = (string)($_SESSION['user_role'] ?? '');
        if (!in_array($role, ['manager', 'admin'], true)) {
            respondJson(['error' => 'Non autorisé'], 403);
        }
    }

    /** PUT/PATCH /api/employes/{id} — employés (role_id = 1) uniquement */
    public function updateEmploye(int $id, array $data): void {
        $this->assertManagerOrAdmin();
        $nom = trim((string)($data['nom_complet'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        if ($nom === '' || $email === '') {
            respondJson(['error' => 'Nom et email requis'], 400);
        }
        $stmt = $this->pdo->prepare('SELECT id, role_id FROM utilisateurs WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || (int)$row['role_id'] !== 1) {
            respondJson(['error' => 'Employé introuvable'], 404);
        }
        $stmt = $this->pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?) AND id != ?');
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            respondJson(['error' => 'Cet email existe déjà'], 409);
        }
        $position = isset($data['position']) ? trim((string)$data['position']) : null;
        $solde_total = (int)($data['solde_total'] ?? 0);
        $solde_consomme = (int)($data['solde_consomme'] ?? 0);
        $telRaw = $data['telephone'] ?? ($data['numero_telephone'] ?? null);
        $tel = is_string($telRaw) ? trim($telRaw) : $telRaw;
        if ($tel === '') {
            $tel = null;
        }

        $sets = ['nom_complet = ?', 'email = ?', 'solde_total = ?', 'solde_consomme = ?'];
        $params = [$nom, $email, $solde_total, $solde_consomme];
        if ($this->columnExists('utilisateurs', 'position')) {
            $sets[] = 'position = ?';
            $params[] = $position === '' ? null : $position;
        }
        if ($this->columnExists('utilisateurs', 'telephone')) {
            $sets[] = 'telephone = ?';
            $params[] = $tel;
        }
        if ($this->columnExists('utilisateurs', 'numero_telephone')) {
            $sets[] = 'numero_telephone = ?';
            $params[] = $tel;
        }
        if ($this->columnExists('utilisateurs', 'bureau') && array_key_exists('bureau', $data)) {
            $b = trim((string)$data['bureau']);
            $sets[] = 'bureau = ?';
            $params[] = $b === '' ? null : $b;
        }
        $params[] = $id;
        $sql = 'UPDATE utilisateurs SET ' . implode(', ', $sets) . ' WHERE id = ? AND role_id = 1';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        $cols = ['id', 'nom_complet', 'email', 'solde_total', 'solde_consomme', 'avatar_url'];
        foreach (['position', 'telephone', 'numero_telephone', 'bureau'] as $c) {
            if ($this->columnExists('utilisateurs', $c)) {
                $cols[] = $c;
            }
        }
        $stmt = $this->pdo->prepare('SELECT ' . implode(', ', $cols) . ' FROM utilisateurs WHERE id = ?');
        $stmt->execute([$id]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($u) {
            $u['telephone'] = ($u['telephone'] ?? '') !== '' ? $u['telephone'] : ($u['numero_telephone'] ?? '');
        }
        respondJson($u);
    }

    /** DELETE /api/employes/{id} */
    public function deleteEmploye(int $id): void {
        $this->assertManagerOrAdmin();
        if ((int)$_SESSION['user_id'] === $id) {
            respondJson(['error' => 'Impossible de supprimer votre propre compte'], 400);
        }
        $stmt = $this->pdo->prepare('SELECT id, role_id FROM utilisateurs WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || (int)$row['role_id'] !== 1) {
            respondJson(['error' => 'Employé introuvable'], 404);
        }
        $stmt = $this->pdo->prepare('DELETE FROM utilisateurs WHERE id = ? AND role_id = 1');
        $stmt->execute([$id]);
        respondJson(['ok' => true]);
    }

    /** POST /api/employes/{id}/avatar (multipart, champ avatar) */
    public function uploadEmployeAvatar(int $employeId): void {
        $this->assertManagerOrAdmin();
        if (!isset($_FILES['avatar'])) {
            respondJson(['error' => 'Aucun fichier envoyé'], 400);
        }
        $stmt = $this->pdo->prepare('SELECT id, role_id FROM utilisateurs WHERE id = ?');
        $stmt->execute([$employeId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || (int)$row['role_id'] !== 1) {
            respondJson(['error' => 'Employé introuvable'], 404);
        }
        $file = $_FILES['avatar'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes, true)) {
            respondJson(['error' => 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.'], 400);
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            respondJson(['error' => 'Fichier trop volumineux (max 5MB)'], 400);
        }
        $uploadDir = dirname(__DIR__) . '/public/uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $employeId . '_' . uniqid('', true) . '.' . $extension;
        $filepath = $uploadDir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            respondJson(['error' => 'Erreur lors du téléchargement'], 500);
        }
        $avatarUrl = app_public_base_url() . '/uploads/avatars/' . $filename;
        try {
            $stmt = $this->pdo->prepare('UPDATE utilisateurs SET avatar_url = ? WHERE id = ?');
            $stmt->execute([$avatarUrl, $employeId]);
            respondJson(['success' => true, 'avatar_url' => $avatarUrl]);
        } catch (Exception $e) {
            error_log('❌ Erreur DB avatar employé: ' . $e->getMessage());
            respondJson(['error' => 'Erreur base de données'], 500);
        }
    }
}