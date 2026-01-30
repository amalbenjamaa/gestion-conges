<?php
class UserController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function createUser($data) {
        $nom_complet = $data['nom_complet'] ?? '';
        $email = $data['email'] ?? '';
        $role_id = $data['role_id'] ?? 1;
        $solde_total = $data['solde_total'] ?? 30;
        $plainPassword = $data['password'] ?? ($data['mot_de_passe'] ?? null);

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
        $hashedPassword = $plainPassword ? password_hash($plainPassword, PASSWORD_DEFAULT) : null;

        // Avatar par défaut selon le rôle
        $avatar_url = $role_id == 2 
            ? "https://ui-avatars.com/api/?name=Manager&background=3b82f6&color=fff&size=200"
            : "https://ui-avatars.com/api/?name=Employee&background=10b981&color=fff&size=200";

        // Insérer l'utilisateur
        $stmt = $this->pdo->prepare("
            INSERT INTO utilisateurs (nom_complet, email, role_id, solde_total, solde_consomme, mot_de_passe, avatar_url) 
            VALUES (?, ?, ?, ?, 0, ?, ?)
        ");
        
        if ($stmt->execute([$nom_complet, $email, $role_id, $solde_total, $hashedPassword, $avatar_url])) {
            respondJson([
                'ok' => true,
                'message' => 'Utilisateur créé avec succès',
                'user_id' => $this->pdo->lastInsertId()
            ]);
        } else {
            respondJson(['error' => 'Erreur lors de la création'], 500);
        }
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
}
