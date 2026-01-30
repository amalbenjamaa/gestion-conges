<?php
class StatsController {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function getStats() {
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

        // Par type
        $stmt = $this->pdo->query("
            SELECT type, COUNT(*) as cnt 
            FROM demandes 
            GROUP BY type 
            ORDER BY cnt DESC
        ");
        $byType = $stmt->fetchAll();

        // Par mois
        $stmt = $this->pdo->query("
            SELECT DATE_FORMAT(created_at, '%Y-%m') as mois, COUNT(*) as cnt 
            FROM demandes 
            GROUP BY mois 
            ORDER BY mois DESC 
            LIMIT 12
        ");
        $perMonth = $stmt->fetchAll();

        respondJson([
            'totalUsers' => $totalUsers,
            'byStatus' => $byStatus,
            'byType' => $byType,
            'perMonth' => $perMonth
        ]);
    }
}