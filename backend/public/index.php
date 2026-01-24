<?php
// backend/public/index.php
// point d'entrée API minimal

// CORS - pour dev local autoriser l'origine du frontend
// (Vite peut tourner en localhost OU 127.0.0.1 selon la config)
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Vary: Origin');
} else {
    // fallback minimal pour dev
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-User-Id, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // CORS preflight
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    exit(0);
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Helpers.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/RequestController.php';
require_once __DIR__ . '/../src/UserController.php';
require_once __DIR__ . '/../src/NotificationController.php';

// start session early
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// simple router
$auth = new AuthController();
$reqCtrl = new RequestController();
$userCtrl = new UserController();
$notifCtrl = new NotificationController();

if ($path === '/api/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    $auth->login($data);
} elseif ($path === '/api/logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $auth->logout();
} elseif ($path === '/api/me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $auth->me();
} elseif ($path === '/api/collaborateurs' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $reqCtrl->listCollaborateurs();
} elseif ($path === '/api/calendar' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $reqCtrl->getCalendarEvents($_GET);
} elseif ($path === '/api/stats' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $reqCtrl->getStats();
} elseif ($path === '/api/notifications' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $notifCtrl->listMine();
} elseif ($path === '/api/notifications/mark-read' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $notifCtrl->markAllRead();
} elseif ($path === '/api/users' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    $userCtrl->createUser($data);
} elseif (preg_match('#^/api/employes/(\d+)$#', $path, $m)) {
    $empId = (int)$m[1];
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userCtrl->getEmploye($empId);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = getJsonInput();
        $userCtrl->updateEmploye($empId, $data);
    } else {
        respondJson(['error' => 'Méthode non implémentée'], 405);
    }
} elseif (preg_match('#^/api/employes/(\d+)/avatar$#', $path, $m) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $userCtrl->uploadAvatar((int)$m[1]);
} elseif (strpos($path, '/api/requests') === 0) {
    // supporter les différents endpoints de RequestController
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (preg_match('#^/api/requests/(\d+)$#', $path, $m)) {
            $reqCtrl->getRequest((int)$m[1]);
        } else {
            $reqCtrl->listRequests($_GET);
    }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        $reqCtrl->createRequest($data);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH' && preg_match('#^/api/requests/(\d+)/status$#', $path, $m)) {
        $data = getJsonInput();
        $reqCtrl->updateStatus((int)$m[1], $data['status'] ?? '', $data['handle_comment'] ?? null);
    } else {
        respondJson(['error' => 'Méthode non implémentée'], 405);
}
} else {
    respondJson(['error' => 'Endpoint non trouvé'], 404);
}