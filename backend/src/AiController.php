<?php

require_once __DIR__ . '/Helpers.php';
require_once __DIR__ . '/Database.php';

class AiController
{
    public function chat(array $data): void
    {
        $userId = getCurrentUserId();
        if (!$userId) {
            respondJson(['error' => 'Authentification requise'], 401);
        }

        // Accept either a single prompt or a messages array for multi-turn chat
        $messages = $data['messages'] ?? null;
        if (!$messages) {
            $prompt = isset($data['prompt']) ? trim((string)$data['prompt']) : '';
            if ($prompt === '') {
                respondJson(['error' => 'Prompt manquant'], 422);
            }
            $messages = [['role' => 'user', 'content' => $prompt]];
        }

        // Read Groq API key from config.ini
        $cfg = parse_ini_file(__DIR__ . '/../config.ini', true);
        $apiKey = $cfg['groq']['GROQ_API_KEY'] ?? '';
        if (!$apiKey || $apiKey === 'gsk_VOTRE_CLE_ICI') {
            respondJson(['error' => 'AI non configurée — clé Groq manquante'], 501);
        }

        // Build enriched system prompt with user context
        $systemPrompt = $this->buildSystemPrompt($userId);

        // Prepend system message to conversation
        $fullMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        );

        $payload = [
            'model'       => 'llama-3.3-70b-versatile',
            'messages'    => $fullMessages,
            'temperature' => 0.3,
            'max_tokens'  => 1024,
        ];

        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $res = curl_exec($ch);
        if ($res === false) {
            $error = curl_error($ch);
            curl_close($ch);
            error_log("Groq curl error: $error");
            respondJson(['error' => 'Erreur de connexion AI'], 502);
        }

        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($res, true);
        if ($code >= 300 || !is_array($json)) {
            error_log("Groq API error ($code): $res");
            respondJson(['error' => 'Réponse AI invalide'], 502);
        }

        $text = '';
        if (isset($json['choices'][0]['message']['content'])) {
            $text = (string)$json['choices'][0]['message']['content'];
        }

        respondJson(['answer' => $text]);
    }

    private function buildSystemPrompt(int $userId): string
    {
        $pdo = Database::getPdo();

        // Get user info + role
        $stmt = $pdo->prepare("
            SELECT u.nom_complet, u.email, u.solde_total, u.solde_consomme,
                   (u.solde_total - u.solde_consomme) AS solde_restant,
                   r.nom AS role_nom
            FROM utilisateurs u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            return "Tu es un assistant RH pour la gestion des congés. Réponds en français.";
        }

        $isManager = in_array($user['role_nom'], ['manager', 'admin']);

        // Get available leave types
        $types = $pdo->query("SELECT nom FROM types_conges ORDER BY id")->fetchAll();
        $typeNames = array_column($types, 'nom');

        // Get user's last 5 requests
        $stmt = $pdo->prepare("
            SELECT d.statut, d.date_debut, d.date_fin, d.nb_jours, d.motif,
                   tc.nom AS type_conge,
                   DATE_FORMAT(d.date_demande, '%d/%m/%Y') AS date_demande_fmt
            FROM demandes d
            JOIN types_conges tc ON tc.id = d.type_id
            WHERE d.utilisateur_id = ?
            ORDER BY d.date_demande DESC
            LIMIT 5
        ");
        $stmt->execute([$userId]);
        $recentRequests = $stmt->fetchAll();

        $requestsText = '';
        if ($recentRequests) {
            $requestsText = "\n\nDernières demandes de congé :\n";
            foreach ($recentRequests as $r) {
                $statut = match($r['statut']) {
                    'en_attente' => 'En attente',
                    'validee'    => 'Validée',
                    'refusee'    => 'Refusée',
                    'annulee'    => 'Annulée',
                    default      => $r['statut'],
                };
                $requestsText .= "- {$r['type_conge']} du {$r['date_debut']} au {$r['date_fin']} ({$r['nb_jours']} jours) — {$statut}\n";
            }
        }

        // Manager-specific context
        $managerContext = '';
        if ($isManager) {
            $pending = $pdo->query("SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente'")->fetchColumn();
            $empCount = $pdo->query("SELECT COUNT(*) FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE r.nom = 'employe'")->fetchColumn();
            $managerContext = "\n\nContexte manager :
- Demandes en attente de validation : {$pending}
- Nombre total d'employés : {$empCount}
Tu peux fournir des informations agrégées sur les demandes et les employés.";
        }

        $prompt = "Tu es un assistant RH intelligent pour l'application de gestion des congés. Réponds toujours en français, de manière concise et utile.

Informations sur l'utilisateur connecté :
- Nom : {$user['nom_complet']}
- Rôle : {$user['role_nom']}
- Solde total de congés : {$user['solde_total']} jours
- Jours consommés : {$user['solde_consomme']} jours
- Solde restant : {$user['solde_restant']} jours

Types de congé disponibles : " . implode(', ', $typeNames) . "
{$requestsText}{$managerContext}

Règles importantes :
- Ne révèle jamais les données personnelles d'autres employés (noms, soldes, etc.) sauf si l'utilisateur est manager ou admin.
- Si on te demande comment poser un congé, explique la procédure dans l'application.
- Si tu ne connais pas la réponse, dis-le honnêtement.
- Sois amical et professionnel.";

        return $prompt;
    }
}
