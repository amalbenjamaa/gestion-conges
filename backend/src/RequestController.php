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

    public function listRequests(array $query = []): void
    {
        $sql = "SELECT d.*, u.nom_complet as requester_name, t.nom as type_name, t.couleur as type_couleur
                FROM demandes d
                JOIN utilisateurs u ON u.id = d.utilisateur_id
                JOIN types_conges t ON t.id = d.type_id
                WHERE 1=1";
        $params = [];

        if (!empty($query['user_id'])) {
            $sql .= " AND d.utilisateur_id = ?";
            $params[] = (int)$query['user_id'];
        }
        if (!empty($query['status'])) {
            $sql .= " AND d.statut = ?";
            $params[] = $query['status'];
        }

        $sql .= " ORDER BY d.date_demande DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        respondJson($stmt->fetchAll(PDO::FETCH_ASSOC));
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
        $stmt = $this->pdo->prepare("SELECT solde_total, solde_consomme FROM utilisateurs WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            respondJson(['error' => 'Utilisateur introuvable'], 404);
        }
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
            $this->notif->createForUser((int)$mid, "Nouvelle demande de {$nomEmploye} ({$start} → {$end})");
        }

        respondJson(['ok' => true, 'id' => $id], 201);
    }

    public function updateStatus(int $id, string $status, ?string $comment = null): void
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
            respondJson(['error' => 'Accès refusé. Seuls les managers peuvent valider les demandes.'], 403);
    }

        // Récupérer la demande pour obtenir les infos
        $stmt = $this->pdo->prepare("SELECT * FROM demandes WHERE id = ?");
        $stmt->execute([$id]);
        $demande = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$demande) {
            respondJson(['error' => 'Demande introuvable'], 404);
        }

        // Calculer le nombre de jours si pas déjà défini
        $nb_jours = $demande['nb_jours'];
        if (!$nb_jours || $nb_jours <= 0) {
            $nb_jours = daysBetweenInclusive($demande['date_debut'], $demande['date_fin']);
            // Mettre à jour le nb_jours dans la demande
            $this->pdo->prepare("UPDATE demandes SET nb_jours = ? WHERE id = ?")->execute([$nb_jours, $id]);
}

        // Mettre à jour le statut
        $stmt = $this->pdo->prepare("UPDATE demandes SET statut = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        // Si la demande est validée, mettre à jour le solde_consomme de l'employé
        if ($status === 'validee') {
            $stmt = $this->pdo->prepare("
                UPDATE utilisateurs 
                SET solde_consomme = solde_consomme + ? 
                WHERE id = ?
            ");
            $stmt->execute([$nb_jours, $demande['utilisateur_id']]);
        }
        // Si la demande était validée et est maintenant refusée/annulée, retirer les jours
        elseif ($demande['statut'] === 'validee' && ($status === 'refusee' || $status === 'annulee')) {
            $stmt = $this->pdo->prepare("
                UPDATE utilisateurs 
                SET solde_consomme = GREATEST(0, solde_consomme - ?) 
                WHERE id = ?
            ");
            $stmt->execute([$nb_jours, $demande['utilisateur_id']]);
        }

        $this->pdo
            ->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, 'changement_statut', ?, ?)")
            ->execute([$id, $handled_by, $comment]);

        // Notification employé
            if ($status === 'validee') {
            $this->notif->createForUser((int)$demande['utilisateur_id'], "Votre demande ({$demande['date_debut']} → {$demande['date_fin']}) a été acceptée.");
        } elseif ($status === 'refusee') {
            $this->notif->createForUser((int)$demande['utilisateur_id'], "Votre demande ({$demande['date_debut']} → {$demande['date_fin']}) a été refusée.");
        }

        respondJson(['ok' => true, 'nb_jours' => $nb_jours]);
                }

    // GET /api/collaborateurs - Liste des employés avec leurs soldes
    public function listCollaborateurs(): void
    {
        $sql = "SELECT 
                    u.id,
                    u.nom_complet as nom,
                    u.email,
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
                WHERE r.nom = 'employe'
                ORDER BY u.nom_complet";
        
        $stmt = $this->pdo->query($sql);
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
        $totalEmployes = (int)$this->pdo->query("SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE r.nom = 'employe'")->fetchColumn();

        $enConge = (int)$this->pdo->query("
            SELECT COUNT(DISTINCT d.utilisateur_id) 
            FROM demandes d 
            WHERE d.statut = 'validee' 
            AND CURDATE() BETWEEN d.date_debut AND d.date_fin
        ")->fetchColumn();

        $presentAujourdhui = $totalEmployes - $enConge;
        $demandesEnAttente = (int)$this->pdo->query("SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente'")->fetchColumn();

        // Répartition par type
        $byType = $this->pdo->query("
            SELECT t.nom as type, COUNT(*) as count, SUM(d.nb_jours) as total_jours
            FROM demandes d
            JOIN types_conges t ON t.id = d.type_id
            WHERE d.statut = 'validee'
            GROUP BY t.nom
        ")->fetchAll(PDO::FETCH_ASSOC);

        // Évolution mensuelle
        $perMonth = $this->pdo->query("
            SELECT 
                DATE_FORMAT(date_demande, '%Y-%m') as month,
                COUNT(*) as count,
                SUM(nb_jours) as total_jours
            FROM demandes
            WHERE statut = 'validee'
            GROUP BY DATE_FORMAT(date_demande, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        ")->fetchAll(PDO::FETCH_ASSOC);

        respondJson([
            'totalEmployes' => $totalEmployes,
            'presentAujourdhui' => $presentAujourdhui,
            'enConge' => $enConge,
            'demandesEnAttente' => $demandesEnAttente,
            'byType' => $byType,
            'perMonth' => $perMonth
        ]);
    }
}