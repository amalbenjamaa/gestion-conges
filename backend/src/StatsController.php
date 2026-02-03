<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class StatsController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
    }

    public function getStats(): void
    {
        try {
            error_log("=== STATS CONTROLLER - getStats ===");
            
            // Total employés
            $sql = "SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE r.nom = 'employe'";
            $totalEmployes = (int)$this->pdo->query($sql)->fetchColumn();

            // En congé aujourd'hui
            $sql = "SELECT COUNT(DISTINCT d.utilisateur_id) FROM demandes d WHERE d.statut = 'validee' AND CURDATE() BETWEEN d.date_debut AND d.date_fin";
            $enConge = (int)$this->pdo->query($sql)->fetchColumn();

            $presentAujourdhui = $totalEmployes - $enConge;
            
            // Demandes en attente
            $sql = "SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente'";
            $demandesEnAttente = (int)$this->pdo->query($sql)->fetchColumn();

            // Demandes validées
            $sql = "SELECT COUNT(*) FROM demandes WHERE statut = 'validee'";
            $demandesValidees = (int)$this->pdo->query($sql)->fetchColumn();

            // Demandes refusées
            $sql = "SELECT COUNT(*) FROM demandes WHERE statut = 'refusee'";
            $demandesRefusees = (int)$this->pdo->query($sql)->fetchColumn();

            // Par statut
            $sql = "SELECT statut, COUNT(*) as cnt FROM demandes GROUP BY statut";
            $byStatus = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            // Répartition par type
            $sql = "
                SELECT 
                    t.nom as type, 
                    COUNT(*) as cnt, 
                    COUNT(*) as count,
                    SUM(d.nb_jours) as total_jours
                FROM demandes d 
                JOIN types_conges t ON t.id = d.type_id 
                WHERE d.statut = 'validee' 
                GROUP BY t.nom
            ";
            $byType = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

            // ✅ ÉVOLUTION MENSUELLE - Récupérer toutes les données
            $sql = "
                SELECT 
                    DATE_FORMAT(d.date_debut, '%Y-%m') as month,
                    COUNT(*) as cnt,
                    SUM(d.nb_jours) as total_jours
                FROM demandes d
                WHERE d.statut = 'validee'
                GROUP BY DATE_FORMAT(d.date_debut, '%Y-%m')
            ";
            $existingData = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
            
            error_log("📊 Données BRUTES de la BDD:");
            foreach ($existingData as $row) {
                error_log("  - Mois: {$row['month']}, Congés: {$row['cnt']}, Jours: {$row['total_jours']}");
            }
            
            // Créer un tableau associatif [mois => données]
            $dataByMonth = [];
            foreach ($existingData as $row) {
                $dataByMonth[$row['month']] = [
                    'cnt' => (int)$row['cnt'],
                    'count' => (int)$row['cnt'],
                    'total_jours' => (int)$row['total_jours']
                ];
            }
            
            // ✅✅✅ JANVIER → DÉCEMBRE DE L'ANNÉE EN COURS ✅✅✅
            $perMonth = [];
            $moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            
            // Récupérer l'année en cours
            $currentYear = date('Y');
            
            // Générer les 12 mois de janvier à décembre
            for ($monthNum = 1; $monthNum <= 12; $monthNum++) {
                $month = sprintf('%s-%02d', $currentYear, $monthNum);
                
                $perMonth[] = [
                    'month' => $month,
                    'mois' => $month,
                    'month_label' => $moisFr[$monthNum - 1] . ' ' . $currentYear,
                    'cnt' => isset($dataByMonth[$month]) ? $dataByMonth[$month]['cnt'] : 0,
                    'count' => isset($dataByMonth[$month]) ? $dataByMonth[$month]['count'] : 0,
                    'total_jours' => isset($dataByMonth[$month]) ? (int)$dataByMonth[$month]['total_jours'] : 0
                ];
            }

            error_log("✅ Mois générés: " . count($perMonth));
            error_log("Ordre: {$perMonth[0]['month_label']} → {$perMonth[11]['month_label']}");
            error_log("Détails complets:");
            foreach ($perMonth as $m) {
                error_log("  - {$m['month_label']}: {$m['count']} congés, {$m['total_jours']} jours");
            }

            respondJson([
                'totalEmployes' => $totalEmployes,
                'presentAujourdhui' => $presentAujourdhui,
                'enConge' => $enConge,
                'conges_en_cours' => $enConge,
                'conges_en_attente' => $demandesEnAttente,
                'demandesEnAttente' => $demandesEnAttente,
                'demandesValidees' => $demandesValidees,
                'demandesRefusees' => $demandesRefusees,
                'totalUsers' => $totalEmployes,
                'taux_absence' => $totalEmployes > 0 ? round(($enConge / $totalEmployes) * 100, 1) : 0,
                'byStatus' => $byStatus,
                'byType' => $byType,
                'perMonth' => $perMonth
            ]);
            
        } catch (PDOException $e) {
            error_log("❌ ERREUR STATS: " . $e->getMessage());
            respondJson(['error' => 'Erreur stats: ' . $e->getMessage()], 500);
        }
    }
}