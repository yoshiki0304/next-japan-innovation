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
    $limit = 100;

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
    if (!is_file($path)) return '';
    $raw = file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') return '';
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) return '';
    return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) ?: '';
}

function get_api_key(): string {
    $key = getenv('GEMINI_API_KEY');
    if (is_string($key) && trim($key) !== '') return trim($key);

    $privateConfig = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'nextji-gemini-key.php';
    if (is_file($privateConfig)) {
        $value = require $privateConfig;
        if (is_string($value) && trim($value) !== '') return trim($value);
    }

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

function call_gemini(string $apiKey, array $payload): array {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return ['status' => 0, 'body' => '', 'error' => 'encode_failed'];

    $headers = [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey,
        'x-goog-api-client: next-japan-innovation-chatbot/2.1'
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
        if (is_array($part) && isset($part['text']) && is_string($part['text'])) $texts[] = $part['text'];
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
if (!is_string($raw) || strlen($raw) > 30000) {
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

if (contains_sensitive_input($message)) {
    respond_json(200, [
        'ok' => true,
        'answer' => '個人情報を含む内容はAIには送信していません。お名前・電話番号・メールアドレスなどは、お問い合わせフォームへ直接ご入力ください。',
        'category' => 'other',
        'action' => 'none',
        'pending_intent' => '',
        'suggest_contact' => true,
    ]);
}

$contents = [];
$historyRaw = $request['history'] ?? [];
if (is_array($historyRaw)) {
    foreach (array_slice($historyRaw, -16) as $item) {
        if (!is_array($item)) continue;
        $role = (string)($item['role'] ?? '');
        $content = trim((string)($item['content'] ?? ''));
        if (($role !== 'user' && $role !== 'assistant') || $content === '') continue;
        $contents[] = [
            'role' => $role === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => trim_text(redact_sensitive_input($content), 1400)]],
        ];
    }
}
$contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

$apiKey = get_api_key();
if ($apiKey === '') {
    respond_json(503, ['ok' => false, 'code' => 'AI_NOT_CONFIGURED', 'message' => '現在AI回答を準備中です。お問い合わせフォームをご利用ください。']);
}

$knowledge = get_nji_knowledge();
$knowledgeBlock = $knowledge !== '' ? "\n\n【NJI専用知識データ・最優先】\n" . $knowledge : '';

$instructions = <<<'PROMPT'
あなたは株式会社Next Japan Innovation（NJI）の公式Webサイトにいる「NJI・chatBOTくん」です。
普通のGeminiやChatGPTのように、単語の完全一致ではなく、文章の意味、会話の流れ、省略、言い換え、指示語、口語、多少の誤字まで含めて自然に理解してください。

【最重要方針】
- 意図判定をキーワード一覧や定型パターンに依存しない。利用者が何を知りたいかを意味として判断する。
- 直前までの会話を必ず参照し、「それ」「じゃあ月額は？」「どのくらい？」「できる？」のような省略された質問も文脈から補完する。
- 同じ意味なら表現が大きく違っても同じ質問として扱う。
- 対象サービスが文脈から明確なら、不要な聞き返しをせず直接回答する。
- 対象サービスだけが分からない場合に限り、自然に聞き返してサービスメニューを出す。
- NJI専用知識データに答えがあるものは、担当者確認に逃げず具体的に答える。
- NJI専用知識データと他の情報が競合する場合は、必ずNJI専用知識データを優先する。

【会話スタイル】
- 必ず日本語。
- 丁寧だが硬すぎず、会社スタッフが自然に会話しているような文体。
- 回答は通常2〜5文。短い質問には短く答えてよい。
- 同じ言い回しを機械的に繰り返さない。
- 「〜ですね！」などは自然な場面では使ってよいが、毎回固定しない。
- Markdown記号、コードブロック、内部管理語「ASK」は利用者に見せない。

【料金・納期・機能】
- 知識データに具体的な料金帯、期間、対応可否がある場合はその内容を明確に案内する。
- 知識データにない金額や条件は推測しない。
- 概算や料金帯は案内してよい。正式見積り・契約条件・個別案件は必要に応じて担当者へ案内する。
- 対応可能な機能は、何ができるか具体的に説明する。
- 対応不可・非推奨の機能は、その旨と理由、代替案があれば案内する。

【サービスが特定できない場合】
利用者の意図は分かるが、どのNJIサービスについての質問かだけが分からない場合は、answerで自然に対象サービスを確認し、action="show_service_menu" にする。
pending_intentには、その会話で利用者が知りたい内容を短く自然な日本語で入れる。例：月額料金、制作期間、機能、連携可否。
サービスが分かる場合は action="none"。

【問い合わせ誘導】
- 知識データだけで回答できる一般質問では suggest_contact=false を基本とする。
- 正式見積り、契約条件、要相談の料金、個別案件、具体的な求人・応募、担当者判断が必要な場合は suggest_contact=true。

【安全】
- 個人情報、カード情報、パスワードをチャット内で求めない。
- AIが正式な契約・申込み・予約確定を受理したと表現しない。
- 法律・税務・医療などの専門判断はしない。

必ず次のJSON形式だけを返してください。コードブロックは禁止です。
{"answer":"利用者への自然な回答","category":"other","action":"none","pending_intent":"","suggest_contact":false}

category は web, sns, ai, reservation, camera, app, placement, recruit, partner, other のいずれか。
action は none または show_service_menu。
PROMPT;

$instructions .= $knowledgeBlock;

$payload = [
    'systemInstruction' => ['parts' => [['text' => $instructions]]],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.72,
        'maxOutputTokens' => 800,
        'responseMimeType' => 'application/json',
    ],
];

$result = call_gemini($apiKey, $payload);
$status = (int)($result['status'] ?? 0);
$body = (string)($result['body'] ?? '');

if ($status < 200 || $status >= 300 || $body === '') {
    error_log('NJI chatbot Gemini request failed. HTTP=' . $status . ' error=' . (string)($result['error'] ?? ''));
    $clientStatus = $status === 429 ? 429 : 502;
    respond_json($clientStatus, [
        'ok' => false,
        'code' => $status === 429 ? 'AI_RATE_LIMIT' : 'AI_UNAVAILABLE',
        'message' => 'AI回答を取得できませんでした。少し時間をおいて再度お試しください。'
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
        'category' => 'other',
        'action' => 'none',
        'pending_intent' => '',
        'suggest_contact' => false,
    ];
}

$answer = trim((string)($structured['answer'] ?? ''));
$category = (string)($structured['category'] ?? 'other');
$action = (string)($structured['action'] ?? 'none');
$pendingIntent = trim((string)($structured['pending_intent'] ?? ''));
$suggestContact = (bool)($structured['suggest_contact'] ?? false);

$allowedCategories = ['web', 'sns', 'ai', 'reservation', 'camera', 'app', 'placement', 'recruit', 'partner', 'other'];
if (!in_array($category, $allowedCategories, true)) $category = 'other';

$allowedActions = ['none', 'show_service_menu'];
if (!in_array($action, $allowedActions, true)) $action = 'none';
if ($action !== 'show_service_menu') $pendingIntent = '';
$pendingIntent = trim_text($pendingIntent, 100);

if ($answer === '') {
    $answer = $action === 'show_service_menu'
        ? 'どちらのサービスについてでしょうか？'
        : 'もう少し詳しく教えていただけますか？';
}

respond_json(200, [
    'ok' => true,
    'answer' => trim_text($answer, 2000),
    'category' => $category,
    'action' => $action,
    'pending_intent' => $pendingIntent,
    'suggest_contact' => $suggestContact,
]);
