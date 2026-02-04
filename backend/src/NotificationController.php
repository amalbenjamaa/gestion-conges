<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class NotificationController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
        $this->ensureTable();
    }

    private function ensureTable()
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              utilisateur_id INT NOT NULL,
              titre VARCHAR(200) NULL,
              message TEXT NOT NULL,
              type VARCHAR(20) DEFAULT 'info',
              lu TINYINT(1) DEFAULT 0,
              date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (utilisateur_id),
              INDEX (lu),
              INDEX (date_creation)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }

    /**
     * Créer une notification
     */
    public function create($userId, $titre, $message, $type = 'info')
    {
        try {
            $sql = "INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation) 
                    VALUES (?, ?, ?, ?, 0, NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId, $titre, $message, $type]);
            
            error_log("✅ Notification créée pour user $userId: $titre");
            return true;
        } catch (PDOException $e) {
            error_log("❌ Erreur création notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Lister mes notifications
     */
    public function listMine()
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];

            $stmt = $this->pdo->prepare("
                SELECT id, message, lu AS is_read, date_creation AS created_at
                FROM notifications
                WHERE utilisateur_id = ?
                ORDER BY date_creation DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Compter les non lues
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE utilisateur_id = ? AND lu = 0");
            $stmt->execute([$userId]);
            $unreadCount = (int)$stmt->fetchColumn();

            respondJson([
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur listMine: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Marquer comme lue
     */
    public function markAsRead($notificationId)
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];

            $sql = "UPDATE notifications SET lu = 1 WHERE id = ? AND utilisateur_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$notificationId, $userId]);

            respondJson(['success' => true]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur markAsRead: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Marquer toutes comme lues
     */
    public function markAllRead()
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];

            $sql = "UPDATE notifications SET lu = 1 WHERE utilisateur_id = ? AND lu = 0";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$userId]);

            $count = $stmt->rowCount();
            
            respondJson([
                'success' => true,
                'marked' => $count
            ]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur markAllRead: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Supprimer une notification
     */
    public function delete($notificationId)
    {
        try {
            if (!isset($_SESSION['user_id'])) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $userId = $_SESSION['user_id'];

            $sql = "DELETE FROM notifications WHERE id = ? AND utilisateur_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$notificationId, $userId]);

            respondJson(['success' => true]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur delete: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}
