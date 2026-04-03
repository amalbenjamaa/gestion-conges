<?php
// backend/src/Database.php
class Database {
    private static $pdo = null;

    public static function getPdo() {
        if (self::$pdo !== null) return self::$pdo;
        $iniPath = __DIR__ . '/../config.ini';
        $cfg = is_readable($iniPath) ? parse_ini_file($iniPath) : [];
        // Variables d'environnement (Railway, Docker, etc.) — prioritaires sur config.ini
        $host = getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: ($cfg['DB_HOST'] ?? '127.0.0.1');
        $db   = getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: ($cfg['DB_NAME'] ?? 'gestion_conges');
        $user = getenv('DB_USER') ?: getenv('MYSQLUSER') ?: ($cfg['DB_USER'] ?? 'root');
        $pass = getenv('DB_PASS') !== false && getenv('DB_PASS') !== ''
            ? getenv('DB_PASS')
            : (getenv('MYSQLPASSWORD') !== false && getenv('MYSQLPASSWORD') !== ''
                ? getenv('MYSQLPASSWORD')
                : ($cfg['DB_PASS'] ?? 'root'));
        $port = (int)(getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: ($cfg['DB_PORT'] ?? 3306));
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        self::$pdo = new PDO($dsn, $user, $pass, $opts);
        return self::$pdo;
    }
}