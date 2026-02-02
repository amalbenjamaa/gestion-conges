<?php
// Router pour le serveur PHP built-in
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = urldecode($uri);

// Si c'est un fichier qui existe, on le sert
$filepath = __DIR__ . $uri;
if ($uri !== '/' && is_file($filepath)) {
    return false; // Laisser PHP servir le fichier
}

// Sinon, on passe par index.php
require __DIR__ . '/index.php';