<?php
// backend/public/index.php
require_once __DIR__ . '/../src/RequestController.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/Helpers.php';

// CORS (autoriser le frontend local)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-User-Id");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$relative = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$ctrl = new RequestController();
$auth = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$segments = array_values(array_filter(explode('/', $relative)));

if ($method === 'POST' && $relative === '/api/login') {
    $data = getJsonInput();
    $auth->login($data);
}

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'requests') {
    if ($method === 'GET' && count($segments) === 2) {
        $ctrl->listRequests($_GET);
    }
    if ($method === 'POST' && count($segments) === 2) {
        $data = getJsonInput();
        $ctrl->createRequest($data);
    }
    if ($method === 'GET' && count($segments) === 3) {
        $ctrl->getRequest($segments[2]);
    }
    if (($method === 'PATCH' || $method === 'POST') && count($segments) === 4 && $segments[3] === 'status') {
        $payload = getJsonInput();
        $ctrl->updateStatus($segments[2], $payload);
    }
    respondJson(['error' => 'Not found'], 404);
}

if ($method === 'GET' && $relative === '/api/stats') {
    $ctrl->stats($_GET);
}

respondJson(['error' => 'Not found'], 404);