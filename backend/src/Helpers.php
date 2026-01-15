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
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-Id'])) return (int)$headers['X-User-Id'];
    if (isset($headers['x-user-id'])) return (int)$headers['x-user-id'];
    return 1; // fallback pour dev
}