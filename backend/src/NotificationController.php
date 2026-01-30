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
        try {
            $cols = $this->pdo->query("SHOW COLUMNS FROM notifications LIKE 'demande_id'")->fetchAll(PDO::FETCH_ASSOC);
            if (!$cols || count($cols) === 0) {
                $this->pdo->exec("ALTER TABLE notifications ADD COLUMN demande_id INT NULL");
                $this->pdo->exec("ALTER TABLE notifications ADD INDEX idx_notif_demande_id (demande_id)");
            }
        } catch (Throwable $e) {}
    }

    public function listMine(): void
    {
        $this->ensureTable();
        $userId = getCurrentUserId();

        $stmt = $this->pdo->prepare("
            SELECT id, message, est_lu, cree_le, demande_id
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

    public function createForUser(int $userId, string $message, ?int $demandeId = null): void
    {
        $this->ensureTable();
        $stmt = $this->pdo->prepare("INSERT INTO notifications (utilisateur_id, message, est_lu, demande_id) VALUES (?, ?, 0, ?)");
        $stmt->execute([$userId, $message, $demandeId]);
    }
}




