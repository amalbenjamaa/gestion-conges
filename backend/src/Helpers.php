<?php
// backend/src/Helpers.php

function respondJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

function daysBetweenInclusive($start, $end) {
    $d1 = new DateTime($start);
    $d2 = new DateTime($end);
    if ($d2 < $d1) return 0;
    $diff = $d2->diff($d1);
    return $diff->days + 1;
}

function getCurrentUserId() {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (!empty($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }
    // Plus de fallback. Si l'utilisateur n'est pas authentifié, on renvoie une erreur 401.
    respondJson(['error' => 'Non authentifié'], 401);
}
?>