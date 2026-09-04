<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond_json(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function text_length(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function trim_text(string $value, int $max): string {
    if (text_length($value) <= $max) return $value;
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

function check_origin(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if ($origin === '' || $host === '') return;

    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = explode(':', $host, 2)[0];
    if (!is_string($originHost) || strcasecmp($originHost, $requestHost) !== 0) {
        respond_json(403, ['ok' => false, 'code' => 'ORIGIN_DENIED']);
    }
}

function enforce_rate_limit(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash('sha256', $ip);
    $path = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'nji-chat-' . $key . '.json';
    $now = time();
    $window = 600;
    $limit = 24;

    $fp = @fopen($path, 'c+');
    if (!$fp) return;

    try {
        if (!flock($fp, LOCK_EX)) return;
        $raw = stream_get_contents($fp);
        $timestamps = json_decode($raw ?: '[]', true);
        if (!is_array($timestamps)) $timestamps = [];
        $timestamps = array_values(array_filter($timestamps, static function ($ts) use ($now, $window) {
            return is_int($ts) && $ts > ($now - $window);
        }));
        if (count($timestamps) >= $limit) {
            flock($fp, LOCK_UN);
            fclose($fp);
            respond_json(429, ['ok' => false, 'code' => 'RATE_LIMIT', 'message' => '短時間に送信できる回数を超えました。少し時間をおいて再度お試しください。']);
        }
        $timestamps[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($timestamps));
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally {
        if (is_resource($fp)) fclose($fp);
    }
}

function get_api_key(): string {
    $key = getenv('OPENAI_API_KEY');
    if (is_string($key) && trim($key) !== '') return trim($key);

    // Optional private configuration outside the public web root.
    $privateConfig = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'nextji-openai-key.php';
    if (is_file($privateConfig)) {
        $value = require $privateConfig;
        if (is_string($value) && trim($value) !== '') return trim($value);
    }

    // Local fallback. Never commit this file to a public repository.
    $localConfig = __DIR__ . DIRECTORY_SEPARATOR . 'chat-api-config.php';
    if (is_file($localConfig)) {
        $value = require $localConfig;
        if (is_string($value) && trim($value) !== '') return trim($value);
    }

    return '';
}

function call_openai(string $apiKey, array $payload): array {
    $url = 'https://api.openai.com/v1/responses';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return ['status' => 0, 'body' => '', 'error' => 'encode_failed'];
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
                'User-Agent: NextJapanInnovation-Chatbot/1.0'
            ],
            CURLOPT_POSTFIELDS => $json,
        ]);
        $body = curl_exec($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status' => $status, 'body' => is_string($body) ? $body : '', 'error' => $error];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'timeout' => 20,
            'ignore_errors' => true,
            'header' => "Authorization: Bearer {$apiKey}\r\nContent-Type: application/json\r\nUser-Agent: NextJapanInnovation-Chatbot/1.0\r\n",
            'content' => $json,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header) && isset($http_response_header[0])) {
        if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $status = (int) $m[1];
    }
    return ['status' => $status, 'body' => is_string($body) ? $body : '', 'error' => $body === false ? 'http_failed' : ''];
}

function extract_output_text(array $response): string {
    if (isset($response['output_text']) && is_string($response['output_text'])) {
        return trim($response['output_text']);
    }
    if (!isset($response['output']) || !is_array($response['output'])) return '';

    $parts = [];
    foreach ($response['output'] as $item) {
        if (!is_array($item) || !isset($item['content']) || !is_array($item['content'])) continue;
        foreach ($item['content'] as $content) {
            if (!is_array($content)) continue;
            if (($content['type'] ?? '') === 'output_text' && isset($content['text']) && is_string($content['text'])) {
                $parts[] = $content['text'];
            }
        }
    }
    return trim(implode("\n", $parts));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond_json(405, ['ok' => false, 'code' => 'METHOD_NOT_ALLOWED']);
}

check_origin();
enforce_rate_limit();

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) {
    respond_json(415, ['ok' => false, 'code' => 'JSON_REQUIRED']);
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 24000) {
    respond_json(413, ['ok' => false, 'code' => 'PAYLOAD_TOO_LARGE']);
}

$request = json_decode($raw, true);
if (!is_array($request)) {
    respond_json(400, ['ok' => false, 'code' => 'INVALID_JSON']);
}

$message = trim((string)($request['message'] ?? ''));
if ($message === '') {
    respond_json(400, ['ok' => false, 'code' => 'MESSAGE_REQUIRED']);
}
if (text_length($message) > 800) {
    respond_json(400, ['ok' => false, 'code' => 'MESSAGE_TOO_LONG', 'message' => '質問は800文字以内で入力してください。']);
}

$history = [];
$historyRaw = $request['history'] ?? [];
if (is_array($historyRaw)) {
    foreach (array_slice($historyRaw, -8) as $item) {
        if (!is_array($item)) continue;
        $role = $item['role'] ?? '';
        $content = trim((string)($item['content'] ?? ''));
        if (($role !== 'user' && $role !== 'assistant') || $content === '') continue;
        $history[] = [
            'role' => $role,
            'content' => trim_text($content, 900),
        ];
    }
}
$history[] = ['role' => 'user', 'content' => $message];

$apiKey = get_api_key();
if ($apiKey === '') {
    respond_json(503, [
        'ok' => false,
        'code' => 'AI_NOT_CONFIGURED',
        'message' => '現在AI回答を準備中です。メニューまたはお問い合わせフォームをご利用ください。'
    ]);
}

$instructions = <<<'PROMPT'
あなたは株式会社Next Japan Innovationの公式Webサイト内「お問い合わせサポートAI」です。
必ず日本語で、簡潔・丁寧・事務的に回答してください。回答は原則2〜5文です。

【確定している会社情報】
- 会社名：株式会社Next Japan Innovation
- 所在地：〒810-0001 福岡県福岡市中央区天神4丁目9-10 第二正友ビル4階
- 電話：092-600-3558
- 電話受付：平日10:00〜18:00
- メール：info@next-ji.jp
- Web：https://next-ji.jp/

【サイトで案内している主な内容】
- ホームページ制作・HP制作
- SNS運用代行・MEO支援
- デジタル化・AI導入補助金支援
- 業務効率化システム・自動化
- 店舗型予約ツール
- ネットワークカメラ
- 店舗公式アプリ
- 有料職業紹介
- 採用情報
- 販売代理店・事業パートナー募集

【有料職業紹介について確定している情報】
- 製造・物流分野を中心に求職者と採用企業をつなぐサービス。
- 求職者には希望条件・経験のヒアリング、求人情報と労働条件の案内、応募・面接日程調整、赴任・入社準備、就業開始後のフォローを行う。
- 採用企業には採用要件の整理、候補者紹介、面接・選考連絡、内定・入社日の調整、採用後の状況確認を行う。
- 取扱求人は時期や地域で異なる。具体的な求人・待遇・勤務地は個別確認が必要。

【厳守事項】
- サイト上で確定していない料金、割引、納期、契約条件、採用条件、求人の有無、補助金の採択可否などを推測・断定しない。
- 不明な場合は「担当者確認が必要」と案内し、問い合わせフォームまたは電話を勧める。
- 個人情報、カード情報、パスワードなどをチャット内で求めない。
- Next Japan Innovationと無関係な雑談・一般質問には深入りせず、会社・サービスに関する相談を案内する。
- 法律・税務・医療などの専門判断は行わない。
- Markdown記号は使わず、プレーンテキストで回答する。

category は次のいずれかを選ぶ：web, sns, ai, reservation, camera, app, placement, recruit, partner, other。
suggest_contact は、見積り、料金、納期、具体的な求人、応募、採用、代理店条件、個別案件、担当者確認が必要な質問では true。それ以外の一般的な案内では false。
PROMPT;

$payload = [
    'model' => 'gpt-5.6-luna',
    'store' => false,
    'max_output_tokens' => 450,
    'instructions' => $instructions,
    'input' => $history,
    'text' => [
        'format' => [
            'type' => 'json_schema',
            'name' => 'nji_support_response',
            'strict' => true,
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'answer' => ['type' => 'string'],
                    'category' => [
                        'type' => 'string',
                        'enum' => ['web', 'sns', 'ai', 'reservation', 'camera', 'app', 'placement', 'recruit', 'partner', 'other']
                    ],
                    'suggest_contact' => ['type' => 'boolean']
                ],
                'required' => ['answer', 'category', 'suggest_contact'],
                'additionalProperties' => false
            ]
        ]
    ]
];

$result = call_openai($apiKey, $payload);
$status = (int)($result['status'] ?? 0);
$body = (string)($result['body'] ?? '');

if ($status < 200 || $status >= 300 || $body === '') {
    error_log('NJI chatbot OpenAI request failed. HTTP=' . $status);
    $clientStatus = $status === 429 ? 429 : 502;
    respond_json($clientStatus, [
        'ok' => false,
        'code' => $status === 429 ? 'AI_RATE_LIMIT' : 'AI_UNAVAILABLE',
        'message' => 'AI回答を取得できませんでした。メニューまたはお問い合わせフォームをご利用ください。'
    ]);
}

$response = json_decode($body, true);
if (!is_array($response)) {
    respond_json(502, ['ok' => false, 'code' => 'AI_INVALID_RESPONSE']);
}

$outputText = extract_output_text($response);
if ($outputText === '') {
    respond_json(502, ['ok' => false, 'code' => 'AI_EMPTY_RESPONSE']);
}

$structured = json_decode($outputText, true);
if (!is_array($structured)) {
    $structured = [
        'answer' => $outputText,
        'category' => 'other',
        'suggest_contact' => true,
    ];
}

$answer = trim((string)($structured['answer'] ?? ''));
$category = (string)($structured['category'] ?? 'other');
$suggestContact = (bool)($structured['suggest_contact'] ?? false);
$allowed = ['web', 'sns', 'ai', 'reservation', 'camera', 'app', 'placement', 'recruit', 'partner', 'other'];
if (!in_array($category, $allowed, true)) $category = 'other';
if ($answer === '') $answer = '担当者による確認が必要です。お問い合わせフォームからご相談ください。';

respond_json(200, [
    'ok' => true,
    'answer' => trim_text($answer, 1400),
    'category' => $category,
    'suggest_contact' => $suggestContact,
]);
