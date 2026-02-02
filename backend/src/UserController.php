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
    
    // ✅ AJOUTER CETTE LIGNE
    $telephone = $data['telephone'] ?? ($data['numero_telephone'] ?? null);

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

    // ✅ MODIFIER LA REQUÊTE INSERT
    $stmt = $this->pdo->prepare("
        INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme, numero_telephone)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ");
    $stmt->execute([$nom_complet, $email, $hashedPassword, $role_id, $solde_total, $telephone]);

    respondJson([
        'id' => $this->pdo->lastInsertId(),
        'nom_complet' => $nom_complet,
        'email' => $email,
        'role_id' => $role_id,
        'numero_telephone' => $telephone
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
}
