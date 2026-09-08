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

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return;
    }

    $raw = stream_get_contents($fp);
    $timestamps = json_decode($raw ?: '[]', true);
    if (!is_array($timestamps)) $timestamps = [];
    $timestamps = array_values(array_filter($timestamps, static function ($ts) use ($now, $window) {
        return is_int($ts) && $ts > ($now - $window);
    }));

    if (count($timestamps) >= $limit) {
        flock($fp, LOCK_UN);
        fclose($fp);
        respond_json(429, [
            'ok' => false,
            'code' => 'RATE_LIMIT',
            'message' => '短時間に送信できる回数を超えました。少し時間をおいて再度お試しください。'
        ]);
    }

    $timestamps[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($timestamps));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function get_nji_knowledge(): string {
    $path = __DIR__ . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'nji-knowledge.json';

    if (!is_file($path)) {
        return '';
    }

    $raw = file_get_contents($path);

    if (!is_string($raw) || trim($raw) === '') {
        return '';
    }

    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        return '';
    }

    return json_encode(
        $decoded,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    ) ?: '';
}

function get_api_key(): string {
    $key = getenv('GEMINI_API_KEY');
    if (is_string($key) && trim($key) !== '') return trim($key);

    // Recommended fallback: keep this file outside the public web root.
    $privateConfig = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'nextji-gemini-key.php';
    if (is_file($privateConfig)) {
        $value = require $privateConfig;
        if (is_string($value) && trim($value) !== '') return trim($value);
    }

    // Last-resort local config. This filename is ignored by Git.
    $localConfig = __DIR__ . DIRECTORY_SEPARATOR . 'chat-api-config.php';
    if (is_file($localConfig)) {
        $value = require $localConfig;
        if (is_string($value) && trim($value) !== '') return trim($value);
    }

    return '';
}

function contains_sensitive_input(string $value): bool {
    if (preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $value)) return true;
    if (preg_match('/(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/', $value)) return true;
    if (preg_match('/(?:\d[ -]?){13,19}/', $value)) return true;
    return false;
}

function redact_sensitive_input(string $value): string {
    $value = preg_replace('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', '[メールアドレス削除]', $value) ?? $value;
    $value = preg_replace('/(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/', '[電話番号削除]', $value) ?? $value;
    $value = preg_replace('/(?:\d[ -]?){13,19}/', '[番号情報削除]', $value) ?? $value;
    return $value;
}

function detect_category(string $text): string {
    if (preg_match('/職業紹介|仕事探|仕事を探|求職|就職|求人紹介|工場求人|物流求人/u', $text)) return 'placement';
    if (preg_match('/ホームページ|\bHP\b|\bWEB\b|サイト|\bLP\b/iu', $text)) return 'web';
    if (preg_match('/SNS|Instagram|インスタ|MEO|Googleマップ|Google Map/iu', $text)) return 'sns';
    if (preg_match('/AI|効率化|システム|自動化|DX/iu', $text)) return 'ai';
    if (preg_match('/予約/u', $text)) return 'reservation';
    if (preg_match('/アプリ/u', $text)) return 'app';
    if (preg_match('/カメラ|防犯/u', $text)) return 'camera';
    if (preg_match('/採用|自社求人|御社で働|応募/u', $text)) return 'recruit';
    if (preg_match('/代理店|パートナー|協業/u', $text)) return 'partner';
    return 'other';
}

function call_gemini(string $apiKey, array $payload): array {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return ['status' => 0, 'body' => '', 'error' => 'encode_failed'];
    }

    $headers = [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey,
        'x-goog-api-client: next-japan-innovation-chatbot/1.0'
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => $headers,
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
            'header' => implode("\r\n", $headers) . "\r\n",
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

function extract_gemini_text(array $response): string {
    $parts = $response['candidates'][0]['content']['parts'] ?? null;
    if (!is_array($parts)) return '';

    $texts = [];
    foreach ($parts as $part) {
        if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
            $texts[] = $part['text'];
        }
    }
    return trim(implode("\n", $texts));
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
    respond_json(400, [
        'ok' => false,
        'code' => 'MESSAGE_TOO_LONG',
        'message' => '質問は800文字以内で入力してください。'
    ]);
}

// On Gemini free tier, avoid sending obvious personal/payment information to Google.
if (contains_sensitive_input($message)) {
    respond_json(200, [
        'ok' => true,
        'answer' => '個人情報を含む内容はAIには送信していません。お名前・電話番号・メールアドレスなどは、お問い合わせフォームへ直接ご入力ください。',
        'category' => detect_category($message),
        'suggest_contact' => true,
    ]);
}

$contents = [];
$historyRaw = $request['history'] ?? [];
if (is_array($historyRaw)) {
    foreach (array_slice($historyRaw, -8) as $item) {
        if (!is_array($item)) continue;
        $role = (string)($item['role'] ?? '');
        $content = trim((string)($item['content'] ?? ''));
        if (($role !== 'user' && $role !== 'assistant') || $content === '') continue;

        $contents[] = [
            'role' => $role === 'assistant' ? 'model' : 'user',
            'parts' => [[
                'text' => trim_text(redact_sensitive_input($content), 900)
            ]],
        ];
    }
}
$contents[] = [
    'role' => 'user',
    'parts' => [['text' => $message]],
];

$apiKey = get_api_key();
if ($apiKey === '') {
    respond_json(503, [
        'ok' => false,
        'code' => 'AI_NOT_CONFIGURED',
        'message' => '現在AI回答を準備中です。メニューまたはお問い合わせフォームをご利用ください。'
    ]);
}
$knowledge = get_nji_knowledge();

$knowledgeBlock = $knowledge !== '' ? "\n\n【NJI専用知識データ】\n" . $knowledge : '';

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
- Markdown記号は使わない。

必ず次のJSONだけを返してください。コードブロックは付けないでください。
{"answer":"利用者への回答","category":"web","suggest_contact":false}
category は web, sns, ai, reservation, camera, app, placement, recruit, partner, other のいずれか。
suggest_contact は、見積り、料金、納期、具体的な求人、応募、採用、代理店条件、個別案件、担当者確認が必要な質問では true。それ以外の一般的な案内では false。
PROMPT;

$instructions .= $knowledgeBlock;

$payload = [
    'systemInstruction' => [
        'parts' => [['text' => $instructions]],
    ],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.2,
        'maxOutputTokens' => 450,
        'responseMimeType' => 'application/json',
    ],
];

$result = call_gemini($apiKey, $payload);
$status = (int)($result['status'] ?? 0);
$body = (string)($result['body'] ?? '');

if ($status < 200 || $status >= 300 || $body === '') {
    error_log('NJI chatbot Gemini request failed. HTTP=' . $status);
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

$outputText = extract_gemini_text($response);
if ($outputText === '') {
    respond_json(502, ['ok' => false, 'code' => 'AI_EMPTY_RESPONSE']);
}

$structured = json_decode($outputText, true);
if (!is_array($structured)) {
    $structured = [
        'answer' => $outputText,
        'category' => detect_category($message),
        'suggest_contact' => true,
    ];
}

$answer = trim((string)($structured['answer'] ?? ''));
$category = (string)($structured['category'] ?? detect_category($message));
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
