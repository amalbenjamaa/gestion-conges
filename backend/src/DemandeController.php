<?php
class DemandeController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function getAllDemandes() {
        $statut = $_GET['statut'] ?? '';
        $userId = $_GET['userId'] ?? '';

        error_log("=== GET ALL DEMANDES ===");
        error_log("Statut filter: $statut");
        error_log("UserId filter: $userId");

        try {
            $sql = "SELECT d.*, u.nom_complet, tc.nom as type_nom
                    FROM demandes d 
                    LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id 
                    LEFT JOIN types_conge tc ON d.type_id = tc.id
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

            $sql .= " ORDER BY d.date_demande DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $demandes = $stmt->fetchAll();

            error_log("Demandes trouvées: " . count($demandes));

            respondJson(['demandes' => $demandes]);
            
        } catch (PDOException $e) {
            error_log("ERREUR GET DEMANDES: " . $e->getMessage());
            respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function createDemande($data) {
        error_log("========================================");
        error_log("=== CREATE DEMANDE - DÉBUT ===");
        error_log("Données reçues: " . json_encode($data));
        
        $type_id = $data['type_id'] ?? null;
        $type_nom = $data['type'] ?? null; // Si le frontend envoie le nom
        $date_debut = $data['date_debut'] ?? '';
        $date_fin = $data['date_fin'] ?? '';
        $motif = $data['commentaire'] ?? $data['motif'] ?? '';
        
        // Récupérer l'utilisateur depuis l'email dans le header
        $userEmail = $_SERVER['HTTP_X_USER_EMAIL'] ?? '';
        
        if (!$userEmail) {
            error_log("ERREUR: Email utilisateur manquant");
            respondJson(['error' => 'Email utilisateur manquant'], 400);
            return;
        }

        try {
            // Récupérer l'ID utilisateur
            $stmt = $this->pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
            $stmt->execute([$userEmail]);
            $user = $stmt->fetch();

            if (!$user) {
                error_log("ERREUR: Utilisateur non trouvé: $userEmail");
                respondJson(['error' => 'Utilisateur non trouvé'], 404);
                return;
            }

            $utilisateur_id = $user['id'];
            error_log("Utilisateur ID: $utilisateur_id");

            // Si on a le nom du type mais pas l'ID, le chercher
            if (!$type_id && $type_nom) {
                $stmt = $this->pdo->prepare("SELECT id FROM types_conge WHERE nom = ?");
                $stmt->execute([$type_nom]);
                $typeResult = $stmt->fetch();
                
                if ($typeResult) {
                    $type_id = $typeResult['id'];
                    error_log("Type trouvé: $type_nom -> ID: $type_id");
                } else {
                    // Type par défaut (Congé Payé = 1 généralement)
                    $type_id = 1;
                    error_log("Type non trouvé, utilisation du type par défaut: $type_id");
                }
            }

            if (!$type_id || !$date_debut || !$date_fin) {
                error_log("ERREUR: Données manquantes");
                respondJson(['error' => 'Type, date début et date fin requis'], 400);
                return;
            }

            // Calculer le nombre de jours ouvrables
            $nb_jours = $this->calculateWorkingDays($date_debut, $date_fin);
            error_log("Jours calculés: $nb_jours");

            $stmt = $this->pdo->prepare("
                INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, statut) 
                VALUES (?, ?, ?, ?, ?, ?, 'en_attente')
            ");

            if ($stmt->execute([$utilisateur_id, $type_id, $date_debut, $date_fin, $nb_jours, $motif])) {
                $newId = $this->pdo->lastInsertId();
                error_log("✓ DEMANDE CRÉÉE AVEC SUCCÈS - ID: $newId");
                
                respondJson([
                    'ok' => true,
                    'message' => 'Demande créée avec succès',
                    'demande_id' => $newId
                ]);
            } else {
                error_log("✗ ERREUR lors de l'insertion");
                respondJson(['error' => 'Erreur lors de la création de la demande'], 500);
            }
            
        } catch (PDOException $e) {
            error_log("✗ EXCEPTION: " . $e->getMessage());
            respondJson(['error' => 'Erreur base de données: ' . $e->getMessage()], 500);
        }
    }

    public function updateDemande($id, $data) {
        error_log("=== UPDATE DEMANDE $id ===");
        
        $statut = $data['statut'] ?? '';
        $commentaire_traitement = $data['commentaire_manager'] ?? $data['commentaire_traitement'] ?? '';

        if (!$statut) {
            respondJson(['error' => 'Statut requis'], 400);
            return;
        }

        try {
            // Récupérer l'ID du manager (depuis la session)
            session_start();
            $traite_par = $_SESSION['user_id'] ?? null;

            $stmt = $this->pdo->prepare("
                UPDATE demandes 
                SET statut = ?, 
                    commentaire_traitement = ?, 
                    traite_par = ?,
                    date_traitement = NOW()
                WHERE id = ?
            ");

            if ($stmt->execute([$statut, $commentaire_traitement, $traite_par, $id])) {
                error_log("✓ Demande $id mise à jour: $statut");
                
                // Si validée, mettre à jour le solde
                if ($statut === 'validee') {
                    $this->updateSolde($id);
                }

                respondJson(['ok' => true, 'message' => 'Demande mise à jour']);
            } else {
                respondJson(['error' => 'Erreur lors de la mise à jour'], 500);
            }
            
        } catch (PDOException $e) {
            error_log("ERREUR UPDATE: " . $e->getMessage());
            respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    private function updateSolde($demandeId) {
        try {
            // Récupérer la demande
            $stmt = $this->pdo->prepare("SELECT utilisateur_id, nb_jours FROM demandes WHERE id = ?");
            $stmt->execute([$demandeId]);
            $demande = $stmt->fetch();

            if ($demande) {
                // Mettre à jour le solde consommé
                $stmt = $this->pdo->prepare("
                    UPDATE utilisateurs 
                    SET solde_consomme = solde_consomme + ? 
                    WHERE id = ?
                ");
                $stmt->execute([$demande['nb_jours'], $demande['utilisateur_id']]);
                error_log("✓ Solde mis à jour pour utilisateur " . $demande['utilisateur_id']);
            }
        } catch (PDOException $e) {
            error_log("ERREUR UPDATE SOLDE: " . $e->getMessage());
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

    public function getDemandeById($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT d.*, u.nom_complet, tc.nom as type_nom
                FROM demandes d
                LEFT JOIN utilisateurs u ON d.utilisateur_id = u.id
                LEFT JOIN types_conge tc ON d.type_id = tc.id
                WHERE d.id = ?
            ");
            $stmt->execute([$id]);
            $demande = $stmt->fetch();
            
            if ($demande) {
                respondJson(['demande' => $demande]);
            } else {
                respondJson(['error' => 'Demande non trouvée'], 404);
            }
        } catch (PDOException $e) {
            respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    public function deleteDemande($id) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM demandes WHERE id = ?");
            if ($stmt->execute([$id])) {
                respondJson(['ok' => true, 'message' => 'Demande supprimée']);
            } else {
                respondJson(['error' => 'Erreur lors de la suppression'], 500);
            }
        } catch (PDOException $e) {
            respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
}