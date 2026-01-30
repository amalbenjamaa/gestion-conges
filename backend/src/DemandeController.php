<?php
class DemandeController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function getAllDemandes() {
        $statut = $_GET['statut'] ?? '';
        $userId = $_GET['userId'] ?? '';

        $sql = "SELECT d.*, u.nom_complet 
                FROM demandes d 
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id 
                WHERE 1=1";

        $params = [];

        if ($statut) {
            $sql .= " AND d.statut = ?";
            $params[] = $statut;
        }

        if ($userId) {
            $sql .= " AND d.utilisateur_id = ?";
            $params[] = $userId;
        }

        $sql .= " ORDER BY d.created_at DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $demandes = $stmt->fetchAll();

        respondJson(['demandes' => $demandes]);
    }

    public function createDemande($data) {
        $type = $data['type'] ?? '';
        $date_debut = $data['date_debut'] ?? '';
        $date_fin = $data['date_fin'] ?? '';
        $commentaire = $data['commentaire'] ?? '';
        
        // Récupérer l'utilisateur depuis l'email dans le header
        $userEmail = $_SERVER['HTTP_X_USER_EMAIL'] ?? '';
        
        if (!$userEmail) {
            respondJson(['error' => 'Email utilisateur manquant'], 400);
            return;
        }

        // Récupérer l'ID utilisateur
        $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
        $stmt->execute([$userEmail]);
        $user = $stmt->fetch();

        if (!$user) {
            respondJson(['error' => 'Utilisateur non trouvé'], 404);
            return;
        }

        $utilisateur_id = $user['id'];

        if (!$type || !$date_debut || !$date_fin) {
            respondJson(['error' => 'Type, date début et date fin requis'], 400);
            return;
        }

        // Calculer le nombre de jours ouvrables
        $nb_jours = $this->calculateWorkingDays($date_debut, $date_fin);

        $stmt = $this->pdo->prepare("
            INSERT INTO demandes (utilisateur_id, type, date_debut, date_fin, nb_jours_ouvrables, commentaire, statut) 
            VALUES (?, ?, ?, ?, ?, ?, 'en_attente')
        ");

        if ($stmt->execute([$utilisateur_id, $type, $date_debut, $date_fin, $nb_jours, $commentaire])) {
            respondJson([
                'ok' => true,
                'message' => 'Demande créée avec succès',
                'demande_id' => $this->pdo->lastInsertId()
            ]);
        } else {
            respondJson(['error' => 'Erreur lors de la création de la demande'], 500);
        }
    }

    public function updateDemande($id, $data) {
        $statut = $data['statut'] ?? '';
        $commentaire_manager = $data['commentaire_manager'] ?? '';

        if (!$statut) {
            respondJson(['error' => 'Statut requis'], 400);
            return;
        }

        $stmt = $this->pdo->prepare("
            UPDATE demandes 
            SET statut = ?, commentaire_manager = ?, updated_at = NOW() 
            WHERE id = ?
        ");

        if ($stmt->execute([$statut, $commentaire_manager, $id])) {
            // Si validée, mettre à jour le solde
            if ($statut === 'validee') {
                $this->updateSolde($id);
            }

            respondJson(['ok' => true, 'message' => 'Demande mise à jour']);
        } else {
            respondJson(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    }

    private function updateSolde($demandeId) {
        // Récupérer la demande
        $stmt = $this->pdo->prepare("SELECT utilisateur_id, nb_jours_ouvrables FROM demandes WHERE id = ?");
        $stmt->execute([$demandeId]);
        $demande = $stmt->fetch();

        if ($demande) {
            // Mettre à jour le solde consommé
            $stmt = $this->pdo->prepare("
                UPDATE utilisateurs 
                SET solde_consomme = solde_consomme + ? 
                WHERE id = ?
            ");
            $stmt->execute([$demande['nb_jours_ouvrables'], $demande['utilisateur_id']]);
        }
    }

    private function calculateWorkingDays($date_debut, $date_fin) {
        $start = new DateTime($date_debut);
        $end = new DateTime($date_fin);
        $end->modify('+1 day');
        
        $interval = new DateInterval('P1D');
        $daterange = new DatePeriod($start, $interval, $end);
        
        $workingDays = 0;
        foreach ($daterange as $date) {
            $dayOfWeek = $date->format('N');
            if ($dayOfWeek < 6) {
                $workingDays++;
            }
        }
        
        return $workingDays;
    }
}