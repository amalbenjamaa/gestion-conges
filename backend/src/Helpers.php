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

/**
 * Retourne l'ID utilisateur courant si présent, sinon null.
 * Supporte :
 *  - Header X-User-Id: <id>
 *  - Authorization: Bearer <id> (simple fallback pour dev)
 *
 * Remarque : pour une vraie authentification, remplacez ce mécanisme
 * par la vérification d'un JWT ou d'une session.
 */
function getCurrentUserId() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];

    // Authorization: Bearer <id>
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(\d+)/i', $headers['Authorization'], $m)) {
            return (int)$m[1];
        }
    }
    if (isset($headers['authorization'])) {
        if (preg_match('/Bearer\s+(\d+)/i', $headers['authorization'], $m)) {
            return (int)$m[1];
        }
    }

    if (isset($headers['X-User-Id'])) return (int)$headers['X-User-Id'];
    if (isset($headers['x-user-id'])) return (int)$headers['x-user-id'];

    // Aucun identifiant fourni
    return null;
}

/**
 * Force l'authentification ; renvoie l'ID utilisateur (int) ou répond 401.
 */
function requireAuth() {
    $uid = getCurrentUserId();
    if (!$uid) {
        respondJson(['error' => 'Authentification requise'], 401);
    }
    return (int)$uid;
}