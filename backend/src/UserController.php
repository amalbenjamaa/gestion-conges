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

    // ✅ LISTE DES EMPLOYÉS POUR LE DASHBOARD
    public function getEmployes() {
    try {
        error_log("=== GET EMPLOYES ===");
        
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
            
            // Vérifier que c'est un manager
            if (!isset($_SESSION['role_id']) || $_SESSION['role_id'] != 2) {
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
}