<?php
// Autoriser localhost:5173 et 4173 en dev
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:4173';
$allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];
header('Access-Control-Allow-Origin: ' . (in_array($origin, $allowed, true) ? $origin : 'http://localhost:4173'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Helpers.php';
require_once __DIR__ . '/../src/AuthController.php';
require_once __DIR__ . '/../src/RequestController.php';
require_once __DIR__ . '/../src/StatsController.php';
require_once __DIR__ . '/../src/UserController.php';
require_once __DIR__ . '/../src/PasswordResetController.php';

// Parse la requête
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($requestUri, PHP_URL_PATH);
// --- Correction importante : lire le body si besoin
$body = json_decode(file_get_contents('php://input'), true);

$passwordResetController = new PasswordResetController();
$auth = new AuthController();
$requestController = new RequestController();
$statsController = new StatsController();
$userController = new UserController();

// ============ MOT DE PASSE OUBLIÉ ============
if ($path === '/api/forgot-password/verify-email' && $method === 'POST') {
    error_log("→ Route: FORGOT PASSWORD - VERIFY EMAIL");
    $passwordResetController->requestReset($body);
    exit;
}
if ($path === '/api/forgot-password/verify-phone' && $method === 'POST') {
    error_log("→ Route: FORGOT PASSWORD - VERIFY PHONE");
    $passwordResetController->verifyPhone($body);
    exit;
}
if ($path === '/api/forgot-password/reset' && $method === 'POST') {
    error_log("→ Route: FORGOT PASSWORD - RESET");
    $passwordResetController->resetPassword($body);
    exit;
}

// ============ UTILISATEUR : CRÉATION ============
if ($method === 'POST' && $path === '/api/users') {
    $userController->createUser($body);
    exit;
}

// ============ NOTIFICATIONS ============
if ($path === '/api/notifications' && $method === 'GET') {
    $notifController = new NotificationController();
    $notifController->listMine();
    exit;
}
if ($path === '/api/notifications/mark-read' && $method === 'POST') {
    $notifController = new NotificationController();
    $notifController->markAllRead();
    exit;
}

error_log("===================");
error_log("📨 $method $path");
error_log("Session ID: " . session_id());
error_log("Session User: " . ($_SESSION['user_id'] ?? 'NON CONNECTÉ'));

// ============ AUTHENTIFICATION ============
if ($path === '/api/login' && $method === 'POST') {
    error_log("→ Route: LOGIN");
    $auth->login($body);
    exit;
}
if ($path === '/api/logout' && $method === 'POST') {
    error_log("→ Route: LOGOUT");
    $auth->logout();
    exit;
}
if ($path === '/api/me' && $method === 'GET') {
    error_log("→ Route: ME");
    $auth->me();
    exit;
}

// ============ UPLOAD AVATAR ============
if ($path === '/api/me/avatar' && $method === 'POST') {
    error_log("→ Route: UPLOAD AVATAR");

    if (!isset($_SESSION['user_id'])) {
        respondJson(['error' => 'Non authentifié'], 401);
        exit;
    }
    if (!isset($_FILES['avatar'])) {
        respondJson(['error' => 'Aucun fichier envoyé'], 400);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $file = $_FILES['avatar'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        error_log("❌ Type non autorisé: " . $file['type']);
        respondJson(['error' => 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.'], 400);
        exit;
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        error_log("❌ Fichier trop gros: " . $file['size']);
        respondJson(['error' => 'Fichier trop volumineux (max 5MB)'], 400);
        exit;
    }
    $uploadDir = __DIR__ . '/uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        error_log("📁 Dossier créé: $uploadDir");
    }
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $userId . '_' . uniqid() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        error_log("❌ Erreur move_uploaded_file");
        respondJson(['error' => 'Erreur lors du téléchargement'], 500);
        exit;
    }
    $avatarUrl = 'http://localhost:8000/uploads/avatars/' . $filename;
    try {
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare("UPDATE utilisateurs SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);
        error_log("✅ Avatar uploadé: $avatarUrl");
        respondJson([
            'success' => true,
            'avatar_url' => $avatarUrl
        ]);
    } catch (Exception $e) {
        error_log("❌ Erreur DB: " . $e->getMessage());
        respondJson(['error' => 'Erreur base de données'], 500);
    }
    exit;
}

// ============ STATISTIQUES ============
if ($path === '/api/stats' && $method === 'GET') {
    error_log("→ Route: STATS");
    $statsController->getStats();
    exit;
}

// ============ UTILISATEURS ============
if ($path === '/api/employes' && $method === 'GET') {
    error_log("→ Route: EMPLOYES");
    $userController->getEmployes();
    exit;
}
// Alias pour compatibilité: /api/collaborateurs -> /api/employes
if ($path === '/api/collaborateurs' && $method === 'GET') {
    error_log("→ Alias: COLLABORATEURS -> EMPLOYES");
    $userController->getEmployes();
    exit;
}

// ============ DEMANDES ============
if ($path === '/api/requests/recent' && $method === 'GET') {
    error_log("→ Route: RECENT REQUESTS");
    $requestController->getRecentRequests();
    exit;
}
if ($path === '/api/my-requests' && $method === 'GET') {
    error_log("→ Route: MY REQUESTS");
    $requestController->getMyRequests();
    exit;
}
if ($path === '/api/requests' && $method === 'GET') {
    error_log("→ Route: REQUESTS (list)");
    // Si un user_id est fourni, lister ses demandes (vue manager)
    if (isset($_GET['user_id'])) {
        $requestController->listRequests($_GET);
    } else {
        $requestController->getPendingRequests();
    }
    exit;
}
if ($path === '/api/requests' && $method === 'POST') {
    error_log("→ Route: CREATE REQUEST");
    $requestController->createRequest($body);
    exit;
}

// ============ MISE À JOUR STATUT DEMANDE (PATCH) ============
if (preg_match('#^/api/requests/(\d+)/status$#', $path, $matches) && $method === 'PATCH') {
    $requestId = (int)$matches[1];
    error_log("→ Route: UPDATE STATUS #$requestId");
    $status = $body['status'] ?? null;
    $comment = $body['comment'] ?? null;
    error_log("Status demandé: $status");
    if (!in_array($status, ['validee', 'refusee'])) {
        respondJson(['error' => 'Statut invalide'], 400);
        exit;
    }
    $requestController->updateStatus($requestId, $status, $comment);
    exit;
}
// ============ VALIDATION/REFUS DEMANDES (POST avec validate/reject) ============
if (preg_match('#^/api/requests/(\d+)/(validate|reject)$#', $path, $matches)) {
    $requestId = (int)$matches[1];
    $action = $matches[2];
    error_log("→ Route: REQUEST $action #$requestId");
    $comment = $body['comment'] ?? null;
    $newStatus = ($action === 'validate') ? 'validee' : 'refusee';
    $requestController->updateStatus($requestId, $newStatus, $comment);
    exit;
}

// ============ CALENDRIER ============
if ($path === '/api/calendar/all' && $method === 'GET') {
    error_log("→ Route: CALENDAR ALL");
    $userController->getAllCalendarEvents();
    exit;
}
if ($path === '/api/calendar' && $method === 'GET') {
    error_log("→ Route: CALENDAR");
    $userController->getCalendarEvents();
    exit;
}

// ============ ROUTE NON TROUVÉE ============
error_log("❌ Route non trouvée: $path");
respondJson(['error' => 'Route non trouvée', 'path' => $path], 404);
