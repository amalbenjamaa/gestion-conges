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

    private function ensureTable(): void
    {
        // Création lazy pour éviter une migration manuelle obligatoire
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
              id INT AUTO_INCREMENT PRIMARY KEY,
              utilisateur_id INT NOT NULL,
              message VARCHAR(500) NOT NULL,
              est_lu TINYINT(1) NOT NULL DEFAULT 0,
              cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX (utilisateur_id),
              INDEX (est_lu),
              CONSTRAINT fk_notifications_user FOREIGN KEY (utilisateur_id)
                REFERENCES utilisateurs(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }

    public function listMine(): void
    {
        $this->ensureTable();
        $userId = getCurrentUserId();

        $stmt = $this->pdo->prepare("
            SELECT id, message, est_lu, cree_le
            FROM notifications
            WHERE utilisateur_id = ?
            ORDER BY id DESC
            LIMIT 50
        ");
        $stmt->execute([$userId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $unread = 0;
        foreach ($items as $n) {
            if ((int)$n['est_lu'] === 0) $unread++;
        }

        respondJson([
            'unread' => $unread,
            'items' => $items,
        ]);
    }

    public function markAllRead(): void
    {
        $this->ensureTable();
        $userId = getCurrentUserId();

        $stmt = $this->pdo->prepare("UPDATE notifications SET est_lu = 1 WHERE utilisateur_id = ?");
        $stmt->execute([$userId]);
        respondJson(['ok' => true]);
    }

    public function createForUser(int $userId, string $message): void
    {
        $this->ensureTable();
        $stmt = $this->pdo->prepare("INSERT INTO notifications (utilisateur_id, message, est_lu) VALUES (?, ?, 0)");
        $stmt->execute([$userId, $message]);
    }
}




