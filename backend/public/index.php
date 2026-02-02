<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = ['http://localhost:5173', 'http://localhost:4173'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

// Charger Database
require_once __DIR__ . '/../src/Database.php';

// Charger Helpers
if (file_exists(__DIR__ . '/../src/Helpers.php')) {
    require_once __DIR__ . '/../src/Helpers.php';
}

// Fonctions utilitaires
if (!function_exists('respondJson')) {
    function respondJson($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}

if (!function_exists('getJsonInput')) {
    function getJsonInput() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?: [];
    }
}

// Charger les contrôleurs
$controllers = [
    'AuthController',
    'UserController',
    'DemandeController',
    'StatsController',
    'RequestController',
    'NotificationController',
    'ForgotPasswordController',
    'PasswordResetController',
    'AiController'
];

foreach ($controllers as $controller) {
    $path = __DIR__ . "/../src/$controller.php";
    if (file_exists($path)) {
        require_once $path;
    }
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

error_log("========================================");
error_log("REQUEST: $method $path");
error_log("Query params: " . print_r($_GET, true));

try {
    // Initialiser les contrôleurs
    $auth = class_exists('AuthController') ? new AuthController() : null;
    $user = class_exists('UserController') ? new UserController() : null;
    $demande = class_exists('DemandeController') ? new DemandeController() : null;
    $stats = class_exists('StatsController') ? new StatsController() : null;
    $request = class_exists('RequestController') ? new RequestController() : null;
    $notification = class_exists('NotificationController') ? new NotificationController() : null;
    $forgot = class_exists('ForgotPasswordController') ? new ForgotPasswordController() : null;
    $passwordReset = class_exists('PasswordResetController') ? new PasswordResetController() : null;
    $ai = class_exists('AiController') ? new AiController() : null;

    // ==================== AUTH ====================
    if ($path === '/api/login' && $method === 'POST') {
        $auth && $auth->login(getJsonInput());
    }

    if ($path === '/api/logout' && $method === 'POST') {
        $auth && $auth->logout();
    }

    if ($path === '/api/me' && $method === 'GET') {
        $auth && method_exists($auth, 'me') && $auth->me();
    }

    if ($path === '/api/me/avatar' && $method === 'POST') {
        $auth && method_exists($auth, 'uploadAvatar') && $auth->uploadAvatar();
    }

    // ==================== USERS ====================
    if ($path === '/api/users' && $method === 'GET') {
        $user && $user->getAllUsers();
    }

    if ($path === '/api/users' && $method === 'POST') {
        $user && $user->createUser(getJsonInput());
    }

    if (preg_match('#^/api/users/(\d+)$#', $path, $matches)) {
        $userId = $matches[1];
        
        if ($method === 'GET') {
            $user && method_exists($user, 'getUserById') && $user->getUserById($userId);
        }
        
        if ($method === 'PATCH') {
            $user && method_exists($user, 'updateUser') && $user->updateUser($userId, getJsonInput());
        }
        
        if ($method === 'DELETE') {
            $user && method_exists($user, 'deleteUser') && $user->deleteUser($userId);
        }
    }

    // ==================== PASSWORD RESET ====================
    if ($path === '/api/forgot-password/verify-email' && $method === 'POST') {
        $forgot && $forgot->verifyEmail(getJsonInput());
    }

    if ($path === '/api/forgot-password/verify-phone' && $method === 'POST') {
        $forgot && $forgot->verifyPhone(getJsonInput());
    }

    if ($path === '/api/forgot-password/reset' && $method === 'POST') {
        $forgot && $forgot->resetPassword(getJsonInput());
    }

    if ($path === '/api/password-reset/request' && $method === 'POST') {
        $passwordReset && $passwordReset->requestReset(getJsonInput());
    }

    if ($path === '/api/password-reset/verify-phone' && $method === 'POST') {
        $passwordReset && $passwordReset->verifyPhone(getJsonInput());
    }

    if ($path === '/api/password-reset/reset' && $method === 'POST') {
        $passwordReset && $passwordReset->resetPassword(getJsonInput());
    }

    // ==================== STATS ====================
    if ($path === '/api/stats' && $method === 'GET') {
        $stats && $stats->getStats();
    }

    // ==================== DEMANDES ====================
    if ($path === '/api/demandes' && $method === 'GET') {
        $demande && $demande->getAllDemandes();
    }

    if ($path === '/api/demandes' && $method === 'POST') {
        $demande && $demande->createDemande(getJsonInput());
    }

    if (preg_match('#^/api/demandes/(\d+)$#', $path, $matches)) {
        $demandeId = $matches[1];
        
        if ($method === 'GET') {
            $demande && method_exists($demande, 'getDemandeById') && $demande->getDemandeById($demandeId);
        }
        
        if ($method === 'PATCH') {
            $demande && method_exists($demande, 'updateDemande') && $demande->updateDemande($demandeId, getJsonInput());
        }
        
        if ($method === 'DELETE') {
            $demande && method_exists($demande, 'deleteDemande') && $demande->deleteDemande($demandeId);
        }
    }

    // ==================== REQUESTS ====================
    if ($path === '/api/requests' && $method === 'GET') {
        error_log("→ Route: GET REQUESTS avec params: " . print_r($_GET, true));
        if ($request && method_exists($request, 'listRequests')) {
            $request->listRequests($_GET);
        } else {
            respondJson(['error' => 'RequestController non disponible'], 500);
        }
    }

    if ($path === '/api/requests' && $method === 'POST') {
        $request && method_exists($request, 'createRequest') && $request->createRequest(getJsonInput());
    }

    if (preg_match('#^/api/requests/(\d+)/status$#', $path, $matches) && $method === 'PATCH') {
        $rid = (int)$matches[1];
        if ($request && method_exists($request, 'updateStatus')) {
            $payload = getJsonInput();
            $request->updateStatus($rid, $payload['status'] ?? '', $payload['handle_comment'] ?? null);
        }
    }

    // ==================== COLLABORATEURS ====================
    if ($path === '/api/collaborateurs' && $method === 'GET') {
        $request && method_exists($request, 'listCollaborateurs') && $request->listCollaborateurs();
    }

    // ==================== CALENDAR ====================
    if ($path === '/api/calendar' && $method === 'GET') {
        $request && method_exists($request, 'getCalendarEvents') && $request->getCalendarEvents($_GET);
    }

    // ==================== NOTIFICATIONS ====================
    if ($path === '/api/notifications' && $method === 'GET') {
        $notification && method_exists($notification, 'listMine') && $notification->listMine();
    }

    if ($path === '/api/notifications/mark-read' && $method === 'POST') {
        $notification && method_exists($notification, 'markAllRead') && $notification->markAllRead();
    }

    // ==================== AI ====================
    if ($path === '/api/ai/chat' && $method === 'POST') {
        $ai && method_exists($ai, 'chat') && $ai->chat(getJsonInput());
    }

    // ==================== 404 ====================
    error_log("✗ Route non trouvée: $method $path");
    respondJson(['error' => 'Route non trouvée', 'method' => $method, 'path' => $path], 404);

} catch (Exception $e) {
    error_log("✗ EXCEPTION: " . $e->getMessage());
    respondJson(['error' => $e->getMessage()], 500);
}