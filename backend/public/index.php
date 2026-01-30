<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
header('Access-Control-Allow-Headers: Content-Type, X-User-Id, X-User-Email, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

// Charger les fichiers requis
require_once __DIR__ . '/../src/Database.php';

// Charger Helpers si existe
if (file_exists(__DIR__ . '/../src/Helpers.php')) {
    require_once __DIR__ . '/../src/Helpers.php';
}

// Fonction respondJson si pas dans Helpers
if (!function_exists('respondJson')) {
    function respondJson($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}

// Fonction getJsonInput si pas dans Helpers
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
    'AiController'
];

foreach ($controllers as $controller) {
    $path = __DIR__ . "/../src/$controller.php";
    if (file_exists($path)) {
        require_once $path;
        error_log("✓ Chargé: $controller");
    } else {
        error_log("⚠ Manquant: $controller");
    }
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

error_log("========================================");
error_log("REQUEST: $method $path");
error_log("Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'none'));

try {
    // Initialiser les contrôleurs
    $auth = class_exists('AuthController') ? new AuthController() : null;
    $user = class_exists('UserController') ? new UserController() : null;
    $demande = class_exists('DemandeController') ? new DemandeController() : null;
    $stats = class_exists('StatsController') ? new StatsController() : null;
    $request = class_exists('RequestController') ? new RequestController() : null;
    $notification = class_exists('NotificationController') ? new NotificationController() : null;
    $ai = class_exists('AiController') ? new AiController() : null;

    // ==================== ROOT HEALTH ====================
    if ($path === '/' && $method === 'GET') {
        respondJson([
            'status' => 'ok',
            'service' => 'gestion-conges-backend',
            'routes' => [
                'POST /api/login',
                'POST /api/logout',
                'GET /api/me',
                'GET /api/users',
                'POST /api/users',
                'GET /api/users/{id}',
                'PATCH /api/users/{id}',
                'DELETE /api/users/{id}',
                'GET /api/stats',
                'GET /api/demandes',
                'POST /api/demandes',
                'GET /api/demandes/{id}',
                'PATCH /api/demandes/{id}',
                'DELETE /api/demandes/{id}',
                'GET /api/requests',
                'POST /api/requests',
                'GET /api/notifications',
                'POST /api/notifications/mark-read',
                'GET /api/collaborateurs',
                'GET /api/calendar',
                'POST /api/ai/chat'
            ]
        ]);
    }

    // ==================== AUTH ====================
    if ($path === '/api/login' && $method === 'POST') {
        error_log("→ Route: LOGIN");
        if ($auth) {
            $auth->login(getJsonInput());
        } else {
            respondJson(['error' => 'AuthController non disponible'], 500);
        }
    }

    if ($path === '/api/logout' && $method === 'POST') {
        error_log("→ Route: LOGOUT");
        if ($auth) {
            $auth->logout();
        } else {
            respondJson(['error' => 'AuthController non disponible'], 500);
        }
    }
    if ($path === '/api/me' && $method === 'GET') {
        error_log("→ Route: ME");
        if ($auth && method_exists($auth, 'me')) {
            $auth->me();
        } else {
            respondJson(['error' => 'Méthode me non disponible'], 500);
        }
    }
    if ($path === '/api/me/avatar' && $method === 'POST') {
        error_log("→ Route: UPLOAD AVATAR (ME)");
        if ($auth && method_exists($auth, 'uploadAvatar')) {
            $auth->uploadAvatar();
        } else {
            respondJson(['error' => 'Méthode uploadAvatar non disponible'], 500);
        }
    }

    // ==================== USERS ====================
    if ($path === '/api/users' && $method === 'GET') {
        error_log("→ Route: GET USERS");
        if ($user) {
            $user->getAllUsers();
        } else {
            respondJson(['error' => 'UserController non disponible'], 500);
        }
    }

    if ($path === '/api/users' && $method === 'POST') {
        error_log("→ Route: CREATE USER");
        if ($user) {
            $user->createUser(getJsonInput());
        } else {
            respondJson(['error' => 'UserController non disponible'], 500);
        }
    }

    if (preg_match('#^/api/users/(\d+)$#', $path, $matches)) {
        $userId = $matches[1];
        
        if ($method === 'GET') {
            error_log("→ Route: GET USER $userId");
            if ($user && method_exists($user, 'getUserById')) {
                $user->getUserById($userId);
            } else {
                respondJson(['error' => 'Méthode getUserById non disponible'], 500);
            }
        }
        
        if ($method === 'PATCH') {
            error_log("→ Route: UPDATE USER $userId");
            if ($user && method_exists($user, 'updateUser')) {
                $user->updateUser($userId, getJsonInput());
            } else {
                respondJson(['error' => 'Méthode updateUser non disponible'], 500);
            }
        }
        
        if ($method === 'DELETE') {
            error_log("→ Route: DELETE USER $userId");
            if ($user && method_exists($user, 'deleteUser')) {
                $user->deleteUser($userId);
            } else {
                respondJson(['error' => 'Méthode deleteUser non disponible'], 500);
            }
        }
    }

    // ==================== STATS ====================
    if ($path === '/api/stats' && $method === 'GET') {
        error_log("→ Route: GET STATS");
        if ($stats) {
            $stats->getStats();
        } else {
            respondJson(['error' => 'StatsController non disponible'], 500);
        }
    }

    // ==================== DEMANDES ====================
    if ($path === '/api/demandes' && $method === 'GET') {
        error_log("→ Route: GET DEMANDES");
        if ($demande) {
            $demande->getAllDemandes();
        } else {
            respondJson(['error' => 'DemandeController non disponible'], 500);
        }
    }

    if ($path === '/api/demandes' && $method === 'POST') {
        error_log("→ Route: CREATE DEMANDE");
        if ($demande) {
            $demande->createDemande(getJsonInput());
        } else {
            respondJson(['error' => 'DemandeController non disponible'], 500);
        }
    }

    if (preg_match('#^/api/demandes/(\d+)$#', $path, $matches)) {
        $demandeId = $matches[1];
        
        if ($method === 'GET') {
            error_log("→ Route: GET DEMANDE $demandeId");
            if ($demande && method_exists($demande, 'getDemandeById')) {
                $demande->getDemandeById($demandeId);
            } else {
                respondJson(['error' => 'Méthode getDemandeById non disponible'], 500);
            }
        }
        
        if ($method === 'PATCH') {
            error_log("→ Route: UPDATE DEMANDE $demandeId");
            if ($demande && method_exists($demande, 'updateDemande')) {
                $demande->updateDemande($demandeId, getJsonInput());
            } else {
                respondJson(['error' => 'Méthode updateDemande non disponible'], 500);
            }
        }
        
        if ($method === 'DELETE') {
            error_log("→ Route: DELETE DEMANDE $demandeId");
            if ($demande && method_exists($demande, 'deleteDemande')) {
                $demande->deleteDemande($demandeId);
            } else {
                respondJson(['error' => 'Méthode deleteDemande non disponible'], 500);
            }
        }
    }

    // ==================== REQUESTS ====================
    if ($request) {
        if ($path === '/api/requests' && $method === 'GET') {
            error_log("→ Route: GET REQUESTS");
            if (method_exists($request, 'listRequests')) {
                $request->listRequests($_GET);
            } else {
                respondJson(['error' => 'Méthode listRequests non disponible'], 500);
            }
        }

        if ($path === '/api/requests' && $method === 'POST') {
            error_log("→ Route: CREATE REQUEST");
            if (method_exists($request, 'createRequest')) {
                $request->createRequest(getJsonInput());
            } else {
                respondJson(['error' => 'Méthode createRequest non disponible'], 500);
            }
        }
    }

    // ==================== REQUEST STATUS ====================
    if (preg_match('#^/api/requests/(\d+)/status$#', $path, $m) && $method === 'PATCH') {
        $rid = (int)$m[1];
        error_log("→ Route: UPDATE REQUEST STATUS $rid");
        if ($request && method_exists($request, 'updateStatus')) {
            $payload = getJsonInput();
            $status = (string)($payload['status'] ?? '');
            $comment = $payload['handle_comment'] ?? null;
            $request->updateStatus($rid, $status, $comment);
        } else {
            respondJson(['error' => 'Méthode updateStatus non disponible'], 500);
        }
    }

    // ==================== COLLABORATEURS ====================
    if ($path === '/api/collaborateurs' && $method === 'GET') {
        error_log("→ Route: GET COLLABORATEURS");
        if ($request && method_exists($request, 'listCollaborateurs')) {
            $request->listCollaborateurs();
        } else {
            respondJson(['error' => 'Méthode listCollaborateurs non disponible'], 500);
        }
    }

    // ==================== CALENDAR ====================
    if ($path === '/api/calendar' && $method === 'GET') {
        error_log("→ Route: GET CALENDAR");
        if ($request && method_exists($request, 'getCalendarEvents')) {
            $request->getCalendarEvents($_GET);
        } else {
            respondJson(['error' => 'Méthode getCalendarEvents non disponible'], 500);
        }
    }

    // ==================== NOTIFICATIONS ====================
    if ($notification) {
        if ($path === '/api/notifications' && $method === 'GET') {
            error_log("→ Route: LIST NOTIFICATIONS (mine)");
            if (method_exists($notification, 'listMine')) {
                $notification->listMine();
            } else {
                respondJson(['error' => 'Méthode listMine non disponible'], 500);
            }
        }
        if ($path === '/api/notifications/mark-read' && $method === 'POST') {
            error_log("→ Route: MARK ALL READ");
            if (method_exists($notification, 'markAllRead')) {
                $notification->markAllRead();
            } else {
                respondJson(['error' => 'Méthode markAllRead non disponible'], 500);
            }
        }
    }

    // ==================== AI ====================
    if ($ai) {
        if ($path === '/api/ai/chat' && $method === 'POST') {
            error_log("→ Route: AI CHAT");
            if (method_exists($ai, 'chat')) {
                $ai->chat(getJsonInput());
            }
        }
    }

    // ==================== 404 ====================
    error_log("✗ Route non trouvée: $method $path");
    error_log("========================================");
    respondJson([
        'error' => 'Route non trouvée',
        'method' => $method,
        'path' => $path,
        'available_routes' => [
            'POST /api/login',
            'POST /api/logout',
            'GET /api/users',
            'POST /api/users',
            'GET /api/users/{id}',
            'PATCH /api/users/{id}',
            'DELETE /api/users/{id}',
            'GET /api/stats',
            'GET /api/demandes',
            'POST /api/demandes',
            'GET /api/demandes/{id}',
            'PATCH /api/demandes/{id}',
            'DELETE /api/demandes/{id}',
        ]
    ], 404);

} catch (Exception $e) {
    error_log("✗ EXCEPTION: " . $e->getMessage());
    error_log("Stack: " . $e->getTraceAsString());
    error_log("========================================");
    respondJson(['error' => $e->getMessage()], 500);
}
