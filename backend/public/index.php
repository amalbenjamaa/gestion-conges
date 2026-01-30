<?php
header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Id, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/UserController.php';
require_once __DIR__ . '/../src/DemandeController.php';
require_once __DIR__ . '/../src/StatsController.php';

function respondJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$auth = new AuthController();
$user = new UserController();
$demande = new DemandeController();
$stats = new StatsController();

// Routes Auth
if ($path === '/api/login' && $method === 'POST') {
    $auth->login(getJsonInput());
}

if ($path === '/api/logout' && $method === 'POST') {
    $auth->logout();
}

// Routes Users
if ($path === '/api/users' && $method === 'GET') {
    $user->getAllUsers();
}

if ($path === '/api/users' && $method === 'POST') {
    $user->createUser(getJsonInput());
}

// Routes Stats
if ($path === '/api/stats' && $method === 'GET') {
    $stats->getStats();
}

// Routes Demandes
if ($path === '/api/demandes' && $method === 'GET') {
    $demande->getAllDemandes();
}

if ($path === '/api/demandes' && $method === 'POST') {
    $demande->createDemande(getJsonInput());
}

if (preg_match('#^/api/demandes/(\d+)$#', $path, $matches) && $method === 'PATCH') {
    $demande->updateDemande($matches[1], getJsonInput());
}

respondJson(['error' => 'Route non trouvée'], 404);