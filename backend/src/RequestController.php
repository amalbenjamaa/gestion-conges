<?php
// backend/src/RequestController.php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class RequestController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    // GET /api/requests?user_id=&status=
    public function listRequests($query) {
        $sql = "SELECT r.*, u.nom_complet as requester_name, t.nom as type_name
                FROM demandes r
                JOIN utilisateurs u ON u.id = r.utilisateur_id
                JOIN types_conges t ON t.id = r.type_id
                WHERE 1=1";
        $params = [];

        if (!empty($query['user_id'])) {
            $sql .= " AND r.utilisateur_id = ?";
            $params[] = (int)$query['user_id'];
        }
        if (!empty($query['status'])) {
            $sql .= " AND r.statut = ?";
            $params[] = $query['status'];
        }

        $sql .= " ORDER BY r.date_demande DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        respondJson($rows);
    }

    // GET /api/requests/:id
    public function getRequest($id) {
        $stmt = $this->pdo->prepare("SELECT r.*, u.nom_complet as requester_name, t.nom as type_name
            FROM demandes r
            JOIN utilisateurs u ON u.id = r.utilisateur_id
            JOIN types_conges t ON t.id = r.type_id
            WHERE r.id = ?");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) respondJson(['error' => 'Not found'], 404);
        respondJson($row);
    }

    // POST /api/requests
    public function createRequest($data) {
        $required = ['utilisateur_id', 'type_id', 'date_debut', 'date_fin'];
        foreach ($required as $r) {
            if (empty($data[$r])) respondJson(['error' => "$r missing"], 400);
        }

        $start = $data['date_debut'];
        $end = $data['date_fin'];
        try {
            $days = daysBetweenInclusive($start, $end);
        } catch (Exception $e) {
            respondJson(['error' => 'Dates invalides'], 400);
        }
        if ($days <= 0) respondJson(['error' => 'date_fin must be >= date_debut'], 400);

        $stmt = $this->pdo->prepare("INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, piece_jointe_id, statut) VALUES (?, ?, ?, ?, ?, ?, NULL, 'en_attente')");
        $stmt->execute([
            (int)$data['utilisateur_id'],
            (int)$data['type_id'],
            $start,
            $end,
            $days,
            $data['motif'] ?? null
        ]);
        $id = $this->pdo->lastInsertId();

        $this->pdo->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, 'creation', ?, ?)")->execute([$id, getCurrentUserId(), null]);

        respondJson(['ok' => true, 'id' => $id], 201);
    }

    // PATCH /api/requests/:id/status
    public function updateStatus($id, $payload) {
        $allowed = ['validee', 'refusee', 'annulee'];
        if (empty($payload['status']) || !in_array($payload['status'], $allowed)) {
            respondJson(['error' => 'statut invalide'], 400);
        }
        $status = $payload['status'];
        $handled_by = getCurrentUserId();
        $comment = $payload['handle_comment'] ?? null;

        try {
            $this->pdo->beginTransaction();
            $stmt = $this->pdo->prepare("SELECT * FROM demandes WHERE id = ? FOR UPDATE");
            $stmt->execute([(int)$id]);
            $req = $stmt->fetch();
            if (!$req) {
                $this->pdo->rollBack();
                respondJson(['error' => 'Request not found'], 404);
            }

            if ($req['statut'] !== 'en_attente') {
                $this->pdo->rollBack();
                respondJson(['error' => 'Request already processed or not in pending'], 400);
            }

            if ($status === 'validee') {
                $stmt2 = $this->pdo->prepare("SELECT solde_total, solde_consomme FROM utilisateurs WHERE id = ? FOR UPDATE");
                $stmt2->execute([(int)$req['utilisateur_id']]);
                $user = $stmt2->fetch();
                if (!$user) {
                    $this->pdo->rollBack();
                    respondJson(['error' => 'User not found'], 500);
                }
                $remaining = (int)$user['solde_total'] - (int)$user['solde_consomme'];
                $need = (int)$req['nb_jours'];
                if ($need > $remaining) {
                    $this->pdo->rollBack();
                    respondJson(['error' => 'Insufficient balance'], 400);
                }
                $upd = $this->pdo->prepare("UPDATE demandes SET statut = 'validee', traite_par = ?, date_traitement = NOW(), commentaire_traitement = ? WHERE id = ?");
                $upd->execute([$handled_by, $comment, (int)$id]);

                $uupd = $this->pdo->prepare("UPDATE utilisateurs SET solde_consomme = solde_consomme + ? WHERE id = ?");
                $uupd->execute([$need, (int)$req['utilisateur_id']]);

                $hist = $this->pdo->prepare("INSERT INTO historique_soldes (utilisateur_id, variation, motif_changement) VALUES (?, ?, ?)");
                $hist->execute([(int)$req['utilisateur_id'], -$need, "Validation demande #$id"]);
            } else {
                $upd = $this->pdo->prepare("UPDATE demandes SET statut = ?, traite_par = ?, date_traitement = NOW(), commentaire_traitement = ? WHERE id = ?");
                $upd->execute([$status, $handled_by, $comment, (int)$id]);
            }

            $action = ($status === 'validee') ? 'validation' : ($status === 'refusee' ? 'refus' : 'annulation');
            $this->pdo->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, ?, ?, ?)")->execute([(int)$id, $action, $handled_by, $comment]);

            $this->pdo->commit();
            respondJson(['ok' => true]);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            respondJson(['error' => $e->getMessage()], 500);
        }
    }

    // GET /api/stats?start=&end=
    public function stats($query) {
        $totalUsers = (int)$this->pdo->query("SELECT COUNT(*) FROM utilisateurs")->fetchColumn();

        $sqlFilter = "WHERE 1=1";
        $params = [];
        if (!empty($query['start'])) {
            $sqlFilter .= " AND date_demande >= ?";
            $params[] = $query['start'];
        }
        if (!empty($query['end'])) {
            $sqlFilter .= " AND date_demande <= ?";
            $params[] = $query['end'] . " 23:59:59";
        }

        $stmt = $this->pdo->prepare("SELECT statut, COUNT(*) AS cnt FROM demandes $sqlFilter GROUP BY statut");
        $stmt->execute($params);
        $byStatus = $stmt->fetchAll();

        $stmt2 = $this->pdo->prepare("SELECT t.nom AS type, COUNT(*) AS cnt FROM demandes d JOIN types_conges t ON t.id = d.type_id $sqlFilter GROUP BY t.nom");
        $stmt2->execute($params);
        $byType = $stmt2->fetchAll();

        $stmt3 = $this->pdo->prepare("
            SELECT DATE_FORMAT(date_demande, '%Y-%m') AS month, COUNT(*) AS cnt
            FROM demandes
            GROUP BY DATE_FORMAT(date_demande, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        ");
        $stmt3->execute();
        $perMonth = $stmt3->fetchAll();

        respondJson([
            'totalUsers' => $totalUsers,
            'byStatus' => $byStatus,
            'byType' => $byType,
            'perMonth' => $perMonth
        ]);
    }
}