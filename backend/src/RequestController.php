<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class RequestController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
    }

    // ✅ Demandes EN ATTENTE (pour validation)
    public function getPendingRequests(): void
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
    public function getRecentRequests(): void
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
    public function getMyRequests(): void
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];
            
            error_log("=== GET MY REQUESTS ===");
            error_log("User ID: $userId");

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
    public function createRequest(array $data): void
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];
            
            error_log("=== CREATE REQUEST ===");
            error_log("User ID: $userId");
            error_log("Data: " . json_encode($data, JSON_UNESCAPED_UNICODE));

            $sql = "
                INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, motif, nb_jours, statut, date_demande)
                VALUES (:user_id, :type_id, :date_debut, :date_fin, :motif, :nb_jours, 'en_attente', NOW())
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'type_id' => $data['type_id'],
                'date_debut' => $data['date_debut'],
                'date_fin' => $data['date_fin'],
                'motif' => $data['motif'] ?? '',
                'nb_jours' => $data['nb_jours']
            ]);
            
            $requestId = $this->pdo->lastInsertId();
            
            error_log("✅ Demande créée: #$requestId");
            
            respondJson(['success' => true, 'id' => $requestId]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur createRequest: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    // ✅ Valider/Refuser une demande
    public function updateStatus(int $requestId, string $status, ?string $comment): void
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            error_log("=== UPDATE STATUS ===");
            error_log("Request ID: $requestId");
            error_log("Status: $status");
            error_log("Comment: $comment");

            $sql = "
                UPDATE demandes 
                SET statut = :status,
                    handle_comment = :comment,
                    handle_date = NOW()
                WHERE id = :id
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'status' => $status,
                'comment' => $comment,
                'id' => $requestId
            ]);
            
            error_log("✅ Statut mis à jour");
            
            respondJson(['success' => true]);
            
        } catch (Exception $e) {
            error_log("❌ Erreur updateStatus: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}