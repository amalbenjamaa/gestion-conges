<?php

require_once __DIR__ . '/Helpers.php';

class AiController
{
    public function chat(array $data): void
    {
        $userId = getCurrentUserId();
        if (!$userId) {
            respondJson(['error' => 'Authentification requise'], 401);
        }
        $prompt = isset($data['prompt']) ? trim((string)$data['prompt']) : '';
        if ($prompt === '') {
            respondJson(['error' => 'Prompt manquant'], 422);
        }
        $apiKey = getenv('OPENAI_API_KEY');
        if (!$apiKey) {
            respondJson(['error' => 'AI non configurée'], 501);
        }
        $payload = [
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'Tu es un assistant RH pour la gestion des congés. Réponds brièvement et de manière utile.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.2
        ];
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        $res = curl_exec($ch);
        if ($res === false) {
            respondJson(['error' => 'Erreur AI'], 502);
        }
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = json_decode($res, true);
        if ($code >= 300 || !is_array($json)) {
            respondJson(['error' => 'Réponse AI invalide'], 502);
        }
        $text = '';
        if (isset($json['choices'][0]['message']['content'])) {
            $text = (string)$json['choices'][0]['message']['content'];
        }
        respondJson(['answer' => $text]);
    }
}
