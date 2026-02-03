<?php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Helpers.php';

class NotificationController
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getPdo();
    }

    /**
     * Créer une notification
     */
    public function create(int $userId, string $titre, string $message, string $type = 'info'): bool
    {
        try {
            $sql = "INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation) 
                    VALUES (:user_id, :titre, :message, :type, 0, NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'titre' => $titre,
                'message' => $message,
                'type' => $type
            ]);
            
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
    public function listMine(): void
    {
        try {
            $user = getAuthenticatedUser();
            if (!$user) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $sql = "
                SELECT 
                    id, 
                    titre, 
                    message, 
                    type, 
                    lu, 
                    date_creation,
                    DATE_FORMAT(date_creation, '%d/%m/%Y à %H:%i') as date_formatted
                FROM notifications
                WHERE utilisateur_id = :user_id
                ORDER BY date_creation DESC
                LIMIT 50
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user_id' => $user['id']]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Compter les non lues
            $sql = "SELECT COUNT(*) FROM notifications WHERE utilisateur_id = :user_id AND lu = 0";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user_id' => $user['id']]);
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
    public function markAsRead(int $notificationId): void
    {
        try {
            $user = getAuthenticatedUser();
            if (!$user) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $sql = "UPDATE notifications SET lu = 1 WHERE id = :id AND utilisateur_id = :user_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'id' => $notificationId,
                'user_id' => $user['id']
            ]);

            respondJson(['success' => true]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur markAsRead: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Marquer toutes comme lues
     */
    public function markAllRead(): void
    {
        try {
            $user = getAuthenticatedUser();
            if (!$user) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $sql = "UPDATE notifications SET lu = 1 WHERE utilisateur_id = :user_id AND lu = 0";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user_id' => $user['id']]);

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
    public function delete(int $notificationId): void
    {
        try {
            $user = getAuthenticatedUser();
            if (!$user) {
                respondJson(['error' => 'Non authentifié'], 401);
                return;
            }

            $sql = "DELETE FROM notifications WHERE id = :id AND utilisateur_id = :user_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'id' => $notificationId,
                'user_id' => $user['id']
            ]);

            respondJson(['success' => true]);
            
        } catch (PDOException $e) {
            error_log("❌ Erreur delete: " . $e->getMessage());
            respondJson(['error' => 'Erreur serveur'], 500);
        }
    }
}