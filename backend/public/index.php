<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Helpers.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/RequestController.php';
require_once __DIR__ . '/../src/StatsController.php';
require_once __DIR__ . '/../src/UserController.php'; // ✅ VÉRIFIER CETTE LIGNE

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url($requestUri, PHP_URL_PATH);

error_log("===================");
error_log("📨 $method $path");
error_log("Session ID: " . session_id());
error_log("Session User: " . ($_SESSION['user_id'] ?? 'NON CONNECTÉ'));

$auth = new AuthController();
$requestController = new RequestController();
$statsController = new StatsController();
$userController = new UserController(); // ✅ VÉRIFIER CETTE LIGNE

// Login
if ($path === '/api/login' && $method === 'POST') {
    error_log("→ Route: LOGIN");
    $input = json_decode(file_get_contents('php://input'), true);
    $auth->login($input);
    exit;
}

// Logout
if ($path === '/api/logout' && $method === 'POST') {
    error_log("→ Route: LOGOUT");
    $auth->logout();
    exit;
}

// Me
if ($path === '/api/me' && $method === 'GET') {
    error_log("→ Route: ME");
    $auth->me();
    exit;
}

// Stats
if ($path === '/api/stats' && $method === 'GET') {
    error_log("→ Route: STATS");
    $statsController->getStats();
    exit;
}

// ✅ EMPLOYÉS - AJOUTER CETTE ROUTE
if ($path === '/api/employes' && $method === 'GET') {
    error_log("→ Route: EMPLOYES");
    $userController->getEmployes();
    exit;
}

// Demandes en attente
if ($path === '/api/requests' && $method === 'GET') {
    error_log("→ Route: REQUESTS");
    $requestController->getPendingRequests();
    exit;
}

// Créer une demande
if ($path === '/api/requests' && $method === 'POST') {
    error_log("→ Route: CREATE REQUEST");
    $input = json_decode(file_get_contents('php://input'), true);
    $requestController->createRequest($input);
    exit;
}

// Mes demandes
if ($path === '/api/my-requests' && $method === 'GET') {
    error_log("→ Route: MY REQUESTS");
    $requestController->getMyRequests();
    exit;
}

// Demandes récentes
if ($path === '/api/requests/recent' && $method === 'GET') {
    error_log("→ Route: RECENT REQUESTS");
    $requestController->getRecentRequests();
    exit;
}

// Valider/Refuser
if (preg_match('#^/api/requests/(\d+)/(validate|reject)$#', $path, $matches)) {
    $requestId = (int)$matches[1];
    $action = $matches[2];
    error_log("→ Route: REQUEST $action #$requestId");
    
    $input = json_decode(file_get_contents('php://input'), true);
    $comment = $input['comment'] ?? null;
    
    $newStatus = ($action === 'validate') ? 'validee' : 'refusee';
    $requestController->updateStatus($requestId, $newStatus, $comment);
    exit;
}

// Route non trouvée
error_log("❌ Route non trouvée: $path");
respondJson(['error' => 'Route non trouvée', 'path' => $path], 404);