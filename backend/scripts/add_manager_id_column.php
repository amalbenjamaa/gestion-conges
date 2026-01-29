<?php
require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::getPdo();
    
    // Check if column exists first
    $stmt = $pdo->query("SHOW COLUMNS FROM utilisateurs LIKE 'manager_id'");
    if ($stmt->fetch()) {
        echo "La colonne manager_id existe déjà.\n";
    } else {
        echo "Ajout de la colonne manager_id...\n";
        $pdo->exec("ALTER TABLE utilisateurs ADD COLUMN manager_id INT NULL");
        $pdo->exec("ALTER TABLE utilisateurs ADD CONSTRAINT fk_utilisateurs_manager FOREIGN KEY (manager_id) REFERENCES utilisateurs(id) ON DELETE SET NULL");
        echo "Colonne manager_id ajoutée avec succès.\n";
    }

} catch (PDOException $e) {
    echo "Erreur SQL : " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
    exit(1);
}
