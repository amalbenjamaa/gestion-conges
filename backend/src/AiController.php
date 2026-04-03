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

        // Clé Groq : variable d'environnement prioritaire (hébergement), sinon config.ini
        $apiKey = getenv('GROQ_API_KEY');
        if (!is_string($apiKey) || trim($apiKey) === '') {
            $iniPath = __DIR__ . '/../config.ini';
            $cfg = is_readable($iniPath) ? parse_ini_file($iniPath, true) : [];
            $apiKey = $cfg['groq']['GROQ_API_KEY'] ?? '';
        }
        $apiKey = trim((string)$apiKey);
        if ($apiKey === '' || $apiKey === 'gsk_VOTRE_CLE_ICI') {
            respondJson(['error' => 'AI non configurée — clé Groq manquante (GROQ_API_KEY ou config.ini [groq])'], 501);
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
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
        // Windows / WAMP : php.ini Apache souvent sans curl.cainfo — forcer le bundle du projet
        $caBundle = $this->resolveCaBundlePath();
        if ($caBundle !== null) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_CAINFO, $caBundle);
        }

        $res = curl_exec($ch);
        if ($res === false) {
            $errno = curl_errno($ch);
            $error = curl_error($ch);
            curl_close($ch);
            error_log("Groq curl error [$errno]: $error");
            // errno 60/77 = souvent certificat SSL (Windows / WAMP)
            $hint = ($errno === 60 || $errno === 77)
                ? ' SSL : vérifiez que backend/certs/cacert.pem est présent, ou définissez CURL_CA_BUNDLE, ou curl.cainfo dans phpForApache.ini (WAMP).'
                : '';
            respondJson([
                'error' => 'Erreur de connexion AI (le serveur PHP n’a pas pu joindre api.groq.com).' . $hint,
            ], 502);
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

        $roleNom = $this->getUserRoleNom($userId);
        $parsed = $this->parseNavFromAnswer($text, $roleNom);
        respondJson([
            'answer'    => $parsed['text'],
            'navigate'  => $parsed['navigate'],
        ]);
    }

    private function getUserRoleNom(int $userId): string
    {
        $pdo = Database::getPdo();
        $stmt = $pdo->prepare('SELECT r.nom FROM utilisateurs u JOIN roles r ON r.id = u.role_id WHERE u.id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (string)$row['nom'] : 'employe';
    }

    /**
     * Extrait [[NAV:/chemin]], vérifie les droits, renvoie le texte sans les balises.
     *
     * @return array{text: string, navigate: string|null}
     */
    private function parseNavFromAnswer(string $text, string $roleNom): array
    {
        $isMgr = in_array($roleNom, ['manager', 'admin'], true);
        if (!preg_match_all('#\[\[NAV:([^\]]*)\]\]#u', $text, $matches, PREG_SET_ORDER)) {
            return ['text' => trim($text), 'navigate' => null];
        }
        $nav = null;
        foreach ($matches as $match) {
            $raw = trim($match[1]);
            if ($raw === '') {
                continue;
            }
            $path = '/' . ltrim($raw, '/');
            $path = (string) strtok($path, '?#');
            if ($this->isNavPathAllowed($path, $isMgr)) {
                $nav = $path;
            }
        }
        $clean = preg_replace('#\s*\[\[NAV:[^\]]*\]\]\s*#u', "\n", $text);
        $clean = trim(preg_replace("#\n{3,}#", "\n\n", $clean));

        return ['text' => $clean, 'navigate' => $nav];
    }

    private function isNavPathAllowed(string $path, bool $isManager): bool
    {
        $forAll = [
            '/dashboard',
            '/mes-demandes',
            '/nouvelle-demande',
            '/profil',
            '/calendrier',
            '/statistiques',
        ];
        $forManagers = [
            '/validation',
            '/gestion-profils',
            '/ajouter-utilisateur',
        ];
        if (in_array($path, $forAll, true)) {
            return true;
        }
        if ($isManager && in_array($path, $forManagers, true)) {
            return true;
        }
        if ($isManager && preg_match('#^/employes/\d+$#', $path)) {
            return true;
        }
        if ($isManager && preg_match('#^/employe/\d+$#', $path)) {
            return true;
        }

        return false;
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
- Sois amical et professionnel.

Navigation dans l'application (SPA React) :
Quand l'utilisateur demande clairement d'ouvrir, accéder ou aller sur une page précise (\"emmène-moi\", \"ouvre la page\", \"va sur\"), réponds en une ou deux phrases puis ajoute UNE DERNIÈRE ligne, seule sur sa ligne, au format exact :
[[NAV:/chemin]]
N'utilise QUE ces chemins (slash initial obligatoire), selon le rôle {$user['role_nom']} :

Chemins pour tous les rôles connectés : /dashboard /mes-demandes /nouvelle-demande /profil /calendrier /statistiques

Chemins réservés au manager ou admin (n'utilise jamais ceux-ci pour un employé) : /validation /gestion-profils /ajouter-utilisateur
Pour une fiche employé dont l'utilisateur donne l'identifiant numérique (ex. \"employé 5\") : /employes/5 ou /employe/5

Si la demande n'est pas une navigation vers une page listée ci-dessus, n'ajoute pas de ligne [[NAV:...]]. N'invente pas d'autres URL.";

        return $prompt;
    }

    /** Bundle CA pour cURL : variable d’environnement ou fichier fourni avec le projet. */
    private function resolveCaBundlePath(): ?string
    {
        $env = getenv('CURL_CA_BUNDLE');
        if (is_string($env) && $env !== '' && is_readable($env)) {
            return $env;
        }
        $local = __DIR__ . '/../certs/cacert.pem';
        if (is_readable($local)) {
            return $local;
        }
        return null;
    }
}
