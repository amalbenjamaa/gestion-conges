<?php
// backend/src/RequestController.php
// (Conserver le reste du fichier inchangé ; ci‑dessous : extraits à remplacer/adapter)

// Exemple : point d'insertion lors de la création d'une demande.
// Remplacez la portion d'insertion existante par celle-ci :

// ... préparation des variables $start, $end, $days, etc.

$userId = getCurrentUserId();
if (!$userId) {
    respondJson(['error' => 'Authentification requise'], 401);
}

$stmt = $this->pdo->prepare("INSERT INTO demandes (utilisateur_id, type_id, date_debut, date_fin, nb_jours, motif, piece_jointe_id, statut) VALUES (?, ?, ?, ?, ?, ?, NULL, 'en_attente')");
$stmt->execute([
    (int)$userId,
    (int)$data['type_id'],
    $start,
    $end,
    $days,
    $data['motif'] ?? null
]);
$id = $this->pdo->lastInsertId();

$this->pdo->prepare("INSERT INTO audit_demandes (demande_id, action, fait_par, commentaire) VALUES (?, 'creation', ?, ?)")->execute([$id, $userId, null]);

respondJson(['ok' => true, 'id' => $id], 201);

// ... fin de la création

// Et pour la mise à jour de statut (PATCH /api/requests/:id/status)
// Assurez-vous d'ajouter une vérification d'authentification avant utilisation :

$handled_by = getCurrentUserId();
if (!$handled_by) {
    respondJson(['error' => 'Authentification requise'], 401);
}

// puis utiliser $handled_by pour audit et opérations