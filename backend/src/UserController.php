<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class UserController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
    }

    // GET /api/employes/:id - Récupérer un employé
    public function getEmploye(int $id): void
    {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.nom_complet, u.email, u.position, u.avatar_url, u.solde_total, u.solde_consomme,
                   (u.solde_total - u.solde_consomme) as solde, r.nom as role_nom
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = ? AND r.nom = 'employe'
        ");
        $stmt->execute([$id]);
        $employe = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employe) {
            respondJson(['error' => 'Employé non trouvé'], 404);
        }
        
        respondJson($employe);
    }

    // PUT /api/employes/:id - Mettre à jour un employé
    public function updateEmploye(int $id, array $data): void
    {
        $handled_by = getCurrentUserId();
        if (!$handled_by) {
            respondJson(['error' => 'Authentification requise'], 401);
        }

        // Vérifier que l'utilisateur est manager
        $stmt = $this->pdo->prepare("
            SELECT r.nom as role 
            FROM utilisateurs u 
            JOIN roles r ON r.id = u.role_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$handled_by]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== 'manager') {
            respondJson(['error' => 'Accès refusé. Seuls les managers peuvent modifier les profils.'], 403);
        }

        // Vérifier que l'employé existe et est bien un employé
        $stmt = $this->pdo->prepare("
            SELECT u.id, r.nom as role_nom
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        $employe = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$employe) {
            respondJson(['error' => 'Employé non trouvé'], 404);
        }
        
        if ($employe['role_nom'] !== 'employe') {
            respondJson(['error' => 'Seuls les employés peuvent être modifiés'], 403);
        }

        // Construire la requête de mise à jour
        $updates = [];
        $params = [];

        if (isset($data['nom_complet'])) {
            $updates[] = "nom_complet = ?";
            $params[] = trim($data['nom_complet']);
        }

        if (isset($data['position'])) {
            $updates[] = "position = ?";
            $params[] = trim($data['position']);
        }

        if (isset($data['email'])) {
            // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
            $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = ? AND id != ?");
            $stmt->execute([$data['email'], $id]);
            if ($stmt->fetch()) {
                respondJson(['error' => 'Cet email est déjà utilisé'], 409);
            }
            $updates[] = "email = ?";
            $params[] = trim($data['email']);
        }

        if (isset($data['avatar_url'])) {
            $updates[] = "avatar_url = ?";
            $params[] = trim($data['avatar_url']);
        }

        if (isset($data['solde_total'])) {
            $solde_total = (int)$data['solde_total'];
            if ($solde_total < 0) {
                respondJson(['error' => 'Le solde total ne peut pas être négatif'], 422);
            }
            $updates[] = "solde_total = ?";
            $params[] = $solde_total;
        }

        if (isset($data['solde_consomme'])) {
            $solde_consomme = (int)$data['solde_consomme'];
            if ($solde_consomme < 0) {
                respondJson(['error' => 'Le solde consommé ne peut pas être négatif'], 422);
            }
            $updates[] = "solde_consomme = ?";
            $params[] = $solde_consomme;
        }

        if (empty($updates)) {
            respondJson(['error' => 'Aucune donnée à mettre à jour'], 422);
        }

        $params[] = $id;
        $sql = "UPDATE utilisateurs SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        // Retourner l'employé mis à jour
        $this->getEmploye($id);
    }

    // POST /api/employes/:id/avatar - Upload avatar (multipart/form-data)
    public function uploadAvatar(int $id): void
    {
        $handled_by = getCurrentUserId();
        if (!$handled_by) {
            respondJson(['error' => 'Authentification requise'], 401);
        }

        // Vérifier manager
        $stmt = $this->pdo->prepare("
            SELECT r.nom as role 
            FROM utilisateurs u 
            JOIN roles r ON r.id = u.role_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$handled_by]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user || $user['role'] !== 'manager') {
            respondJson(['error' => 'Accès refusé. Seuls les managers peuvent modifier les profils.'], 403);
        }

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
            // fallback depuis mime
            $ext = str_replace('image/', '', $mime);
            if ($ext === 'jpeg') $ext = 'jpg';
        }

        $dir = __DIR__ . '/../public/uploads/avatars';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $filename = 'avatar_' . $id . '_' . uniqid() . '.' . $ext;
        $destPath = $dir . '/' . $filename;
        if (!move_uploaded_file($tmp, $destPath)) {
            respondJson(['error' => "Impossible d'enregistrer l'image"], 500);
        }

        $avatarUrl = "http://localhost:8000/uploads/avatars/" . $filename;
        $stmt = $this->pdo->prepare("UPDATE utilisateurs SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $id]);

        $this->getEmploye($id);
    }

    // POST /api/users - Créer un nouvel utilisateur (employé ou manager)
    public function createUser(array $data): void
    {
        $handled_by = getCurrentUserId();
        if (!$handled_by) {
            respondJson(['error' => 'Authentification requise'], 401);
        }

        // Vérifier que l'utilisateur est manager
        $stmt = $this->pdo->prepare("
            SELECT r.nom as role 
            FROM utilisateurs u 
            JOIN roles r ON r.id = u.role_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$handled_by]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || $user['role'] !== 'manager') {
            respondJson(['error' => 'Accès refusé. Seuls les managers peuvent créer des utilisateurs.'], 403);
        }

        // Valider les champs requis (supporte 'password' ou 'pwd')
        $rawPassword = $data['password'] ?? ($data['pwd'] ?? null);
        if (empty($data['nom_complet']) || empty($data['email']) || empty($rawPassword) || empty($data['role_id'])) {
            respondJson(['error' => 'Champs requis manquants: nom_complet, email, password/pwd, role_id'], 422);
        }

        // Vérifier que l'email n'existe pas déjà
        $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
        $stmt->execute([trim($data['email'])]);
        if ($stmt->fetch()) {
            respondJson(['error' => 'Cet email est déjà utilisé'], 409);
        }

        // Vérifier que le rôle existe
        $role_id = (int)$data['role_id'];
        $stmt = $this->pdo->prepare("SELECT id, nom FROM roles WHERE id = ?");
        $stmt->execute([$role_id]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$role) {
            respondJson(['error' => 'Rôle invalide'], 422);
        }

        // Hash du mot de passe
        $passwordHash = password_hash($rawPassword, PASSWORD_DEFAULT);

        // Insérer l'utilisateur
        try {
            // Vérifier la présence des colonnes telephone/bureau
            $hasTelephone = false;
            $hasBureau = false;
            try {
                $q1 = $this->pdo->query("SHOW COLUMNS FROM utilisateurs LIKE 'telephone'");
                $hasTelephone = (bool)$q1->fetch();
                $q2 = $this->pdo->query("SHOW COLUMNS FROM utilisateurs LIKE 'bureau'");
                $hasBureau = (bool)$q2->fetch();
            } catch (PDOException $e) {
                // ignore
            }

            $columns = ['nom_complet', 'email', 'mot_de_passe', 'role_id', 'position', 'date_naissance', 'solde_total', 'solde_consomme', 'manager_id'];
            $values = [
                trim($data['nom_complet']),
                trim($data['email']),
                $passwordHash,
                $role_id,
                !empty($data['position']) ? trim($data['position']) : null,
                !empty($data['date_naissance']) ? $data['date_naissance'] : null,
                (int)($data['solde_total'] ?? 25),
                (int)($data['solde_consomme'] ?? 0),
                $handled_by
            ];

            if ($hasTelephone) {
                array_splice($columns, 2, 0, ['telephone']);
                array_splice($values, 2, 0, [!empty($data['telephone']) ? trim($data['telephone']) : null]);
            }
            if ($hasBureau) {
                $idx = $hasTelephone ? 3 : 2;
                array_splice($columns, $idx, 0, ['bureau']);
                array_splice($values, $idx, 0, [!empty($data['bureau']) ? trim($data['bureau']) : null]);
            }

            $placeholders = implode(', ', array_fill(0, count($columns), '?'));
            $sql = "INSERT INTO utilisateurs (" . implode(', ', $columns) . ") VALUES ({$placeholders})";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            $id = $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            respondJson(['error' => 'Erreur lors de la création de l\'utilisateur: ' . $e->getMessage()], 500);
        }

        // Retourner l'utilisateur créé
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.nom_complet, u.email, u.telephone, u.bureau, u.position, u.solde_total, u.solde_consomme,
                   (u.solde_total - u.solde_consomme) as solde, r.nom as role_nom
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        $newUser = $stmt->fetch(PDO::FETCH_ASSOC);

        respondJson($newUser, 201);
    }
}
