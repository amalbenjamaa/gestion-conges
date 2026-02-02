<?php

require_once __DIR__ . '/Database.php';

class StatsController {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getPdo();
    }

    public function getStats(): void {
        error_log("=== GET STATS ===");
        
        try {
            // Total employés (seulement ceux avec role_id = 1)
            $stmt = $this->pdo->query("
                SELECT COUNT(*) as cnt 
                FROM utilisateurs u
                JOIN roles r ON r.id = u.role_id
                WHERE r.nom = 'employe'
            ");
            $totalEmployes = (int)$stmt->fetch()['cnt'];

            // Présents aujourd'hui (employés sans congé validé aujourd'hui)
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT u.id) as cnt
                FROM utilisateurs u
                JOIN roles r ON r.id = u.role_id
                LEFT JOIN demandes d ON d.utilisateur_id = u.id 
                    AND d.statut = 'validee'
                    AND CURDATE() BETWEEN d.date_debut AND d.date_fin
                WHERE r.nom = 'employe' AND d.id IS NULL
            ");
            $presentAujourdhui = (int)$stmt->fetch()['cnt'];

            // En congé aujourd'hui
            $stmt = $this->pdo->query("
                SELECT COUNT(DISTINCT u.id) as cnt
                FROM utilisateurs u
                JOIN roles r ON r.id = u.role_id
                JOIN demandes d ON d.utilisateur_id = u.id
                WHERE r.nom = 'employe'
                AND d.statut = 'validee'
                AND CURDATE() BETWEEN d.date_debut AND d.date_fin
            ");
            $enConge = (int)$stmt->fetch()['cnt'];

            // Demandes en attente
            $stmt = $this->pdo->query("
                SELECT COUNT(*) as cnt
                FROM demandes
                WHERE statut = 'en_attente'
            ");
            $demandesEnAttente = (int)$stmt->fetch()['cnt'];

            // Demandes validées
            $stmt = $this->pdo->query("
                SELECT COUNT(*) as cnt
                FROM demandes
                WHERE statut = 'validee'
            ");
            $demandesValidees = (int)$stmt->fetch()['cnt'];

            // Demandes refusées
            $stmt = $this->pdo->query("
                SELECT COUNT(*) as cnt
                FROM demandes
                WHERE statut = 'refusee'
            ");
            $demandesRefusees = (int)$stmt->fetch()['cnt'];

            // Par statut
            $stmt = $this->pdo->query("
                SELECT statut, COUNT(*) as cnt 
                FROM demandes 
                GROUP BY statut
            ");
            $byStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Par type
            $stmt = $this->pdo->query("
                SELECT 
                    COALESCE(tc.nom, 'Autre') as type, 
                    COUNT(*) as cnt,
                    COUNT(*) as count
                FROM demandes d
                LEFT JOIN types_conges tc ON d.type_id = tc.id
                GROUP BY d.type_id, tc.nom
                ORDER BY cnt DESC
            ");
            $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Évolution mensuelle (12 derniers mois)
           // Évolution mensuelle (TOUS les mois où il y a des demandes)
$stmt = $this->pdo->query("
    SELECT 
        DATE_FORMAT(date_demande, '%Y-%m') as month,
        DATE_FORMAT(date_demande, '%Y-%m') as mois,
        COUNT(*) as cnt,
        COUNT(*) as count,
        SUM(nb_jours) as total_jours
    FROM demandes 
    GROUP BY month 
    ORDER BY month ASC
");
$perMonth = $stmt->fetchAll(PDO::FETCH_ASSOC);
            respondJson([
                'totalEmployes' => $totalEmployes,
                'presentAujourdhui' => $presentAujourdhui,
                'enConge' => $enConge,
                'demandesEnAttente' => $demandesEnAttente,
                'demandesValidees' => $demandesValidees,
                'demandesRefusees' => $demandesRefusees,
                'totalUsers' => $totalEmployes,
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