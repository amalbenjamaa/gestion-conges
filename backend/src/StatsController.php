<?php
class StatsController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function getStats() {
        error_log("=== GET STATS ===");
        
        try {
            // Total utilisateurs
            $stmt = $this->pdo->query("SELECT COUNT(*) as cnt FROM utilisateurs");
            $totalUsers = $stmt->fetch()['cnt'];

            // Par statut
            $stmt = $this->pdo->query("
                SELECT statut, COUNT(*) as cnt 
                FROM demandes 
                GROUP BY statut
            ");
            $byStatus = $stmt->fetchAll();

            // Par type (avec jointure sur types_conge)
            $stmt = $this->pdo->query("
                SELECT tc.nom as type, COUNT(*) as cnt 
                FROM demandes d
                LEFT JOIN types_conge tc ON d.type_id = tc.id
                GROUP BY d.type_id, tc.nom
                ORDER BY cnt DESC
            ");
            $byType = $stmt->fetchAll();

            // Par mois
            $stmt = $this->pdo->query("
                SELECT DATE_FORMAT(date_demande, '%Y-%m') as mois, COUNT(*) as cnt 
                FROM demandes 
                GROUP BY mois 
                ORDER BY mois DESC 
                LIMIT 12
            ");
            $perMonth = $stmt->fetchAll();

            error_log("Stats: Users=$totalUsers, Status=" . count($byStatus) . ", Types=" . count($byType));

            respondJson([
                'totalUsers' => $totalUsers,
                'byStatus' => $byStatus,
                'byType' => $byType,
                'perMonth' => $perMonth
            ]);
            
        } catch (PDOException $e) {
            error_log("ERREUR STATS: " . $e->getMessage());
            respondJson(['error' => 'Erreur lors de la récupération des stats: ' . $e->getMessage()], 500);
        }
    }
}