<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';
require_once __DIR__ . '/NotificationController.php';

class RequestController
{
    private PDO $pdo;
    private NotificationController $notif;

    public function __construct()
    {
        // Utilise la méthode statique définie dans Database.php
        $this->pdo = Database::getPdo();
        $this->notif = new NotificationController();
    }

  public function listRequests(array $params = []): void
{
    error_log("=== LIST REQUESTS ===");
    error_log("Params reçus: " . print_r($params, true));
    
    try {
        // ✅ Récupérer TOUS les filtres possibles
        $userId = $params['user_id'] ?? null;
        $status = $params['status'] ?? null;  // ✅ AJOUTER
        $recent = $params['recent'] ?? null;  // ✅ AJOUTER (pour Dashboard)
        
        error_log("Filtre user_id: " . ($userId ?? 'aucun'));
        error_log("Filtre status: " . ($status ?? 'aucun'));
        error_log("Filtre recent: " . ($recent ?? 'aucun'));
        
        $sql = "
            SELECT 
                d.id,
                d.utilisateur_id,
                u.nom_complet as requester_name,
                u.email as requester_email,
                d.type_id,
                tc.nom as type_name,
                u.avatar_url,
                d.date_debut,
                d.date_fin,
                d.nb_jours,
                d.motif,
                d.statut,
                d.date_demande
            FROM demandes d
            JOIN utilisateurs u ON u.id = d.utilisateur_id
            LEFT JOIN types_conges tc ON tc.id = d.type_id
            WHERE 1=1
        ";
        
        $bindParams = [];
        
        // ✅ Filtre par utilisateur (pour page "Mes Demandes")
        if ($userId) {
            $sql .= " AND d.utilisateur_id = :user_id";
            $bindParams[':user_id'] = (int)$userId;
        }
        
        // ✅ Filtre par statut (pour page "Validation")
        if ($status) {
            $sql .= " AND d.statut = :status";
            $bindParams[':status'] = $status;
        }
        
        // ✅ Filtre par date récente (pour Dashboard)
        if ($recent) {
            $sql .= " AND d.date_demande >= DATE_SUB(NOW(), INTERVAL 3 DAY)";
        }
        
        // Trier par date décroissante
        $sql .= " ORDER BY d.date_demande DESC, d.id DESC";
        
        error_log("SQL: " . $sql);
        error_log("Bind params: " . print_r($bindParams, true));
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindParams);
        
        $demandes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("✅ Résultats: " . count($demandes) . " demandes trouvées");
        
        respondJson($demandes);
        
    } catch (PDOException $e) {
        error_log("❌ ERREUR LIST REQUESTS: " . $e->getMessage());
        respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
    }
}

    public function getRequest(int $id): void
    {
        $stmt = $this->pdo->prepare("SELECT * FROM demandes WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            respondJson(['error' => 'Demande introuvable'], 404);
        }
        respondJson($row);
    }

    public function createRequest(array $data): void
    {
        if (empty($data['type_id']) || empty($data['date_debut']) || empty($data['date_fin'])) {
            respondJson(['error' => 'Champs requis manquants'], 422);
        }

        $start = $data['date_debut'];
        $end   = $data['date_fin'];
        if (!is_string($start) || !is_string($end) || $start === '' || $end === '') {
            respondJson(['error' => 'Dates invalides'], 422);
        }

        // Calculer automatiquement le nombre de jours si pas fourni
        $days = $data['nb_jours'] ?? null;
        if (!$days || $days <= 0) {
            $days = daysBetweenInclusive($start, $end);
        }
        $days = (int)$days;
        if ($days <= 0) {
            respondJson(['error' => 'La période demandée est invalide'], 422);
        }

        $userId = getCurrentUserId();
        if (!$userId) {
            respondJson(['error' => 'Authentification requise'], 401);
        }

        // Vérifier le solde de congés de l'utilisateur
        $stmt = $this->pdo->prepare("
            SELECT u.solde_total, u.solde_consomme, r.nom as role_nom 
            FROM utilisateurs u 
            JOIN roles r ON r.id = u.role_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            respondJson(['error' => 'Utilisateur introuvable'], 404);
        }
        
        // Les managers et admins n'ont pas de limite de quota
        if ($user['role_nom'] !== 'manager' && $user['role_nom'] !== 'admin') {
            $soldeTotal = (int)$user['solde_total'];
            $soldeConsomme = (int)$user['solde_consomme'];
            $soldeRestant = $soldeTotal - $soldeConsomme;

            if ($soldeRestant < 0) {
                $soldeRestant = 0;
            }

            if ($days > $soldeRestant) {
                respondJson([
                    'error' => "Vous n'avez pas assez de jours de congés restants. Solde restant : {$soldeRestant} jours."
                ], 422);
            }
        }

        $stmt = $this->pdo->prepare(
            "INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, piece_jointe_id, statut)
             VALUES (?, ?, ?, ?, ?, ?, NULL, 'en_attente')"
        );
        $stmt->execute([
            (int)$userId,
            (int)$data['type_id'],
            $start,
            $end,
            $days,
            $data['motif'] ?? null
        ]);
        $id = $this->pdo->lastInsertId();

        $this->pdo
            ->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, 'creation', ?, ?)")
            ->execute([$id, $userId, null]);

        // Notification manager (tous les managers -> dans ton cas tu n'en auras qu'un seul)
        $stmt = $this->pdo->query("
            SELECT u.id
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE r.nom = 'manager'
        ");
        $managers = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $this->pdo->prepare("SELECT nom_complet FROM utilisateurs WHERE id = ?");
        $stmt->execute([(int)$userId]);
        $nomEmploye = (string)($stmt->fetchColumn() ?: 'Employé');

        foreach ($managers as $mid) {
            $this->notif->createForUser((int)$mid, "Nouvelle demande de {$nomEmploye} ({$start} → {$end})", (int)$id);
        }

        respondJson(['ok' => true, 'id' => $id], 201);
    }

    public function updateStatus(int $requestId, string $newStatus, ?string $handleComment = null): void
{
    try {
        $user = getAuthenticatedUser();
        if (!$user) {
            respondJson(['error' => 'Non authentifié'], 401);
            return;
        }

        // Récupérer la demande
        $sql = "SELECT * FROM demandes WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $requestId]);
        $demande = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$demande) {
            respondJson(['error' => 'Demande non trouvée'], 404);
            return;
        }

        // Mise à jour du statut
        $sql = "UPDATE demandes SET statut = :statut, handle_comment = :comment WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'statut' => $newStatus,
            'comment' => $handleComment,
            'id' => $requestId
        ]);

        // ✅ CRÉER UNE NOTIFICATION
        $notification = new NotificationController();
        
        if ($newStatus === 'validee') {
            $notification->create(
                $demande['utilisateur_id'],
                '✅ Demande validée',
                'Votre demande de congé du ' . date('d/m/Y', strtotime($demande['date_debut'])) . ' a été validée.',
                'success'
            );
        } elseif ($newStatus === 'refusee') {
            $message = 'Votre demande de congé du ' . date('d/m/Y', strtotime($demande['date_debut'])) . ' a été refusée.';
            if ($handleComment) {
                $message .= ' Motif: ' . $handleComment;
            }
            $notification->create(
                $demande['utilisateur_id'],
                '❌ Demande refusée',
                $message,
                'error'
            );
        }

        respondJson(['success' => true, 'message' => 'Statut mis à jour']);
        
    } catch (PDOException $e) {
        error_log("❌ Erreur updateStatus: " . $e->getMessage());
        respondJson(['error' => 'Erreur serveur'], 500);
    }
}
    // GET /api/collaborateurs - Liste des employés avec leurs soldes
    public function listCollaborateurs(): void
    {
        $currentUserId = getCurrentUserId();
        
        $sql = "SELECT 
                    u.id,
                    u.nom_complet as nom,
                    u.email,
                    u.avatar_url,
                    u.position,
                    u.solde_total as quota_annuel,
                    u.solde_consomme as consomme,
                    (u.solde_total - u.solde_consomme) as solde,
                    r.nom as role_nom,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM demandes d 
                            WHERE d.utilisateur_id = u.id 
                            AND d.statut = 'validee' 
                            AND CURDATE() BETWEEN d.date_debut AND d.date_fin
                        ) THEN 'En congé'
                        ELSE 'Présent'
                    END as statut
                FROM utilisateurs u
                JOIN roles r ON r.id = u.role_id
                WHERE r.nom = 'employe'";

        $params = [];

        $sql .= " ORDER BY u.nom_complet";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        respondJson($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // GET /api/calendar - Événements pour le calendrier
    public function getCalendarEvents(array $query = []): void
    {
        $start = $query['start'] ?? date('Y-m-01');
        $end = $query['end'] ?? date('Y-m-t');

        $sql = "SELECT 
                    d.id,
                    d.date_debut as start,
                    d.date_fin as end,
                    u.nom_complet as title,
                    t.nom as type,
                    t.couleur as color,
                    d.statut
                FROM demandes d
                JOIN utilisateurs u ON u.id = d.utilisateur_id
                JOIN types_conges t ON t.id = d.type_id
                WHERE d.statut = 'validee'
                AND d.date_debut <= ?
                AND d.date_fin >= ?
                ORDER BY d.date_debut";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$end, $start]);
        respondJson($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // GET /api/stats - Statistiques réelles
 public function getStats(): void
{
    try {
        // Total employes
        $sql = "SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE r.nom = 'employe'";
        $totalEmployes = (int)$this->pdo->query($sql)->fetchColumn();

        // En congé aujourd'hui
        $sql = "
            SELECT COUNT(DISTINCT d.utilisateur_id) 
            FROM demandes d
            WHERE d.statut = 'validee' 
            AND CURDATE() BETWEEN d.date_debut AND d.date_fin";
        $enConge = (int)$this->pdo->query($sql)->fetchColumn();

        $presentAujourdhui = $totalEmployes - $enConge;
        
        // Demandes en attente
        $sql = "SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente'";
        $demandesEnAttente = (int)$this->pdo->query($sql)->fetchColumn();

        // Répartition par type
        $sql = "
            SELECT t.nom as type, COUNT(*) as count, SUM(d.nb_jours) as total_jours
            FROM demandes d
            JOIN types_conges t ON t.id = d.type_id
            WHERE d.statut = 'validee'
            GROUP BY t.nom
        ";
        $stmt = $this->pdo->query($sql);
        $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // ✅ ÉVOLUTION MENSUELLE - FORCER LES 12 MOIS
        // Récupérer toutes les demandes validées par mois
        $sql = "
            SELECT 
                DATE_FORMAT(d.date_debut, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(d.nb_jours) as total_jours
            FROM demandes d
            WHERE d.statut = 'validee'
            GROUP BY DATE_FORMAT(d.date_debut, '%Y-%m')
        ";
        $stmt = $this->pdo->query($sql);
        $existingData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Créer un tableau associatif [mois => données]
        $dataByMonth = [];
        foreach ($existingData as $row) {
            $dataByMonth[$row['month']] = [
                'count' => (int)$row['count'],
                'total_jours' => (int)$row['total_jours']
            ];
        }
        
        // ✅ GÉNÉRER EXPLICITEMENT LES 12 DERNIERS MOIS
        $perMonth = [];
        $moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        for ($i = 11; $i >= 0; $i--) {
            $timestamp = strtotime("-$i months");
            $month = date('Y-m', $timestamp); // 2026-02
            $monthNum = (int)date('m', $timestamp) - 1; // 0-11
            $year = date('Y', $timestamp);
            $monthLabel = $moisFr[$monthNum] . ' ' . $year; // Fév 2026
            
            $perMonth[] = [
                'month' => $month,
                'month_label' => $monthLabel,
                'count' => isset($dataByMonth[$month]) ? $dataByMonth[$month]['count'] : 0,
                'total_jours' => isset($dataByMonth[$month]) ? $dataByMonth[$month]['total_jours'] : 0
            ];
        }
        
        error_log("✅ PerMonth généré avec " . count($perMonth) . " mois");
        error_log("Détails: " . json_encode($perMonth));

        respondJson([
            'total_employes' => $totalEmployes,
            'present_aujourdhui' => $presentAujourdhui,
            'conges_en_cours' => $enConge,
            'conges_en_attente' => $demandesEnAttente,
            'taux_absence' => $totalEmployes > 0 ? round(($enConge / $totalEmployes) * 100, 1) : 0,
            'byType' => $byType,
            'perMonth' => $perMonth
        ]);
        
    } catch (PDOException $e) {
        error_log("❌ ERREUR STATS: " . $e->getMessage());
        respondJson(['error' => 'Erreur: ' . $e->getMessage()], 500);
    }
}
}
