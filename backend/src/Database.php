<?php
// backend/src/Database.php
class Database {
    private static $pdo = null;

    public static function getPdo() {
        if (self::$pdo !== null) return self::$pdo;
        $cfg = parse_ini_file(__DIR__ . '/../config.ini');
        $host = $cfg['DB_HOST'] ?? '127.0.0.1';
        $db   = $cfg['DB_NAME'] ?? 'gestion_conges';
        $user = $cfg['DB_USER'] ?? 'root';
        $pass = $cfg['DB_PASS'] ?? '';
        $port = $cfg['DB_PORT'] ?? 3306;
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        self::$pdo = new PDO($dsn, $user, $pass, $opts);
        return self::$pdo;
    }
}