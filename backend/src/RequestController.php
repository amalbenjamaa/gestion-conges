<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class RequestController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
    }

    // ✅ Lister les demandes (filtrage par employé pour vue manager)
    public function listRequests(array $query = [])
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }
            // Seuls les managers peuvent consulter l'historique d'un employé
            if (!isset($_SESSION['role_id']) || (int)$_SESSION['role_id'] !== 2) {
                respondJson(['error' => 'Non autorisé'], 403);
                return;
            }

            $sql = "
                SELECT 
                    d.*,
                    tc.nom AS type_name
                FROM demandes d
                LEFT JOIN types_conges tc ON tc.id = d.type_id
            ";
            $params = [];
            if (!empty($query['user_id'])) {
                $sql .= " WHERE d.utilisateur_id = ? ";
                $params[] = (int)$query['user_id'];
            }
            $sql .= " ORDER BY d.date_demande DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            respondJson($rows);
        } catch (Exception $e) {
            error_log("❌ Erreur listRequests: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // ✅ Demandes EN ATTENTE (pour validation)
    public function getPendingRequests()
    {
        try {
            error_log("=== GET PENDING REQUESTS ===");
            
            $sql = "
                SELECT 
                    d.*,
                    u.nom_complet,
                    u.email as user_email,
                    tc.nom as type_conge,
                    tc.couleur as type_couleur,
                    DATE_FORMAT(d.date_debut, '%d/%m/%Y') as date_debut_formatted,
                    DATE_FORMAT(d.date_fin, '%d/%m/%Y') as date_fin_formatted,
                    DATE_FORMAT(d.date_demande, '%d/%m/%Y à %H:%i') as date_demande_formatted
                FROM demandes d
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id
                LEFT JOIN types_conges tc ON d.type_id = tc.id
                WHERE d.statut = 'en_attente'
                ORDER BY d.date_demande DESC
            ";
            
            $stmt = $this->pdo->query($sql);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("✅ Demandes en attente: " . count($requests));
            
            respondJson(['requests' => $requests]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur getPendingRequests: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // ✅ Demandes RÉCENTES (7 derniers jours)
    public function getRecentRequests()
    {
        try {
            error_log("=== GET RECENT REQUESTS ===");
            
            $sql = "
                SELECT 
                    d.*,
                    u.nom_complet,
                    u.email as user_email,
                    tc.nom as type_conge,
                    tc.couleur as type_couleur,
                    DATE_FORMAT(d.date_debut, '%d/%m/%Y') as date_debut_formatted,
                    DATE_FORMAT(d.date_fin, '%d/%m/%Y') as date_fin_formatted,
                    DATE_FORMAT(d.date_demande, '%d/%m/%Y à %H:%i') as date_demande_formatted
                FROM demandes d
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id
                LEFT JOIN types_conges tc ON d.type_id = tc.id
                WHERE d.date_demande >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY d.date_demande DESC
                LIMIT 20
            ";
            
            $stmt = $this->pdo->query($sql);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("✅ Demandes récentes (7j): " . count($requests));
            
            respondJson(['requests' => $requests]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur getRecentRequests: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // ✅ MES demandes (pour employés)
   public function getMyRequests()
{
    try {
        if (!isset($_SESSION['user_id'])) {
            respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $userId = $_SESSION['user_id'];
        
        error_log("=== GET MY REQUESTS ===");
        error_log("User ID: $userId");

        // ✅ Pas de filtre WHERE statut = ... pour avoir TOUTES les demandes
        $sql = "
            SELECT 
                d.*,
                DATE_FORMAT(d.date_debut, '%d/%m/%Y') as date_debut_formatted,
                DATE_FORMAT(d.date_fin, '%d/%m/%Y') as date_fin_formatted,
                DATE_FORMAT(d.date_demande, '%d/%m/%Y à %H:%i') as date_demande_formatted,
                tc.nom as type_conge,
                tc.couleur as type_couleur
            FROM demandes d
            LEFT JOIN types_conges tc ON d.type_id = tc.id
            WHERE d.utilisateur_id = ?
            ORDER BY d.date_demande DESC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("✅ Mes demandes: " . count($requests));
        
        respondJson(['requests' => $requests]);
        
    } catch (Exception $e) {
        error_log("❌ Erreur getMyRequests: " . $e->getMessage());
        respondJson(['error' => 'Erreur serveur'], 500);
    }
}

    // ✅ Créer une demande
    public function createRequest($data)
{
    try {
        if (!isset($_SESSION['user_id'])) {
            respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        $userId = $_SESSION['user_id'];
        
        error_log("=== CREATE REQUEST ===");
        error_log("User ID: $userId");
        error_log("Data reçu: " . json_encode($data, JSON_UNESCAPED_UNICODE));

        // ✅ Calculer nb_jours si absent ou vide
        if (!isset($data['nb_jours']) || empty($data['nb_jours'])) {
            $dateDebut = new DateTime($data['date_debut']);
            $dateFin = new DateTime($data['date_fin']);
            $interval = $dateDebut->diff($dateFin);
            $data['nb_jours'] = $interval->days + 1; // +1 pour inclure le dernier jour
            error_log("✅ nb_jours calculé automatiquement: {$data['nb_jours']}");
        }

        $sql = "
            INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, motif, nb_jours, statut, date_demande)
            VALUES (?, ?, ?, ?, ?, ?, 'en_attente', NOW())
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $userId,
            $data['type_id'],
            $data['date_debut'],
            $data['date_fin'],
            $data['motif'] ?? '',
            $data['nb_jours']
        ]);
        
        $requestId = $this->pdo->lastInsertId();
        
        error_log("✅ Demande créée avec succès: #$requestId");

        // Notifications: informer tous les managers
        try {
            require_once __DIR__ . '/NotificationController.php';
            $notif = new NotificationController();
            $stmtManagers = $this->pdo->query("SELECT id FROM utilisateurs WHERE role_id = 2");
            $managers = $stmtManagers->fetchAll(PDO::FETCH_COLUMN);
            $stmtUser = $this->pdo->prepare("SELECT nom_complet FROM utilisateurs WHERE id = ?");
            $stmtUser->execute([$userId]);
            $userName = $stmtUser->fetchColumn() ?: 'Un employé';
            $titre = 'Nouvelle demande';
            $message = "$userName a soumis une demande du {$data['date_debut']} au {$data['date_fin']}";
            foreach ($managers as $mid) {
                $notif->create((int)$mid, $titre, $message, 'info');
            }
        } catch (Exception $e) {
            error_log("❌ Erreur notification création demande: " . $e->getMessage());
        }

        respondJson(['success' => true, 'id' => $requestId, 'message' => 'Demande créée avec succès']);
        
    } catch (Exception $e) {
        error_log("❌ Erreur createRequest: " . $e->getMessage());
        error_log("❌ Stack trace: " . $e->getTraceAsString());
        respondJson(['error' => 'Erreur serveur', 'details' => $e->getMessage()], 500);
    }
}
    // ✅ Valider/Refuser une demande
    public function updateStatus($requestId, $newStatus, $comment = null)
    {
        try {
            error_log("=== UPDATE STATUS ===");
            error_log("Request ID: $requestId");
            error_log("Status: $newStatus");
            error_log("Comment: " . ($comment ?? 'aucun'));
            
            if (!isset($_SESSION['user_id'])) {
                error_log("❌ Non authentifié");
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }
            
            if (!isset($_SESSION['role_id']) || $_SESSION['role_id'] != 2) {
                error_log("❌ Non autorisé - Role: " . ($_SESSION['role_id'] ?? 'aucun'));
                respondJson(['error' => 'Seul un manager peut valider/refuser'], 403);
                return;
            }
            
            // Récupérer la demande
            $stmt = $this->pdo->prepare("SELECT * FROM demandes WHERE id = ?");
            $stmt->execute([$requestId]);
            $demande = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$demande) {
                error_log("❌ Demande non trouvée");
                respondJson(['error' => 'Demande non trouvée'], 404);
                return;
            }
            
            error_log("✅ Demande trouvée: ID {$demande['id']}, User {$demande['utilisateur_id']}");
            
            // ✅ CORRECTION : Mise à jour SANS commentaire_manager
            $sql = "UPDATE demandes SET statut = ?, date_traitement = NOW() WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$newStatus, $requestId]);
            
            error_log("✅ Demande #$requestId mise à jour : $newStatus");
            
            // Sauvegarder le commentaire dans les logs
            if ($comment) {
                error_log("💬 Commentaire manager: $comment");
            }
            
            // Si validée, mettre à jour le solde
            if ($newStatus === 'validee') {
                $userId = $demande['utilisateur_id'];
                $nbJours = $demande['nb_jours'];
                
                $updateSolde = $this->pdo->prepare("
                    UPDATE utilisateurs 
                    SET solde_consomme = solde_consomme + ? 
                    WHERE id = ?
                ");
                $updateSolde->execute([$nbJours, $userId]);
                
                error_log("✅ Solde mis à jour pour user $userId : +$nbJours jours");
            }
            
            // Notifications: informer l'employé
            try {
                require_once __DIR__ . '/NotificationController.php';
                $notif = new NotificationController();
                $titre = 'Demande traitée';
                $msgStatus = $newStatus === 'validee' ? 'acceptée' : 'refusée';
                $message = "Votre demande (#$requestId) a été $msgStatus.";
                $notif->create((int)$demande['utilisateur_id'], $titre, $message, $newStatus === 'validee' ? 'success' : 'warning');
            } catch (Exception $e) {
                error_log("❌ Erreur notification updateStatus: " . $e->getMessage());
            }
            
            respondJson([
                'success' => true,
                'message' => $newStatus === 'validee' ? 'Demande validée' : 'Demande refusée'
            ]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur updateStatus: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}
