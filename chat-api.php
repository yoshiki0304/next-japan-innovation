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

function detect_category(string $text): string {
    if (preg_match('/職業紹介|仕事探|仕事を探|求職|就職|求人紹介|工場求人|物流求人/u', $text)) return 'placement';
    if (preg_match('/ホームページ|\bHP\b|\bWEB\b|サイト|\bLP\b/iu', $text)) return 'web';
    if (preg_match('/SNS|Instagram|インスタ|MEO|Googleマップ|Google Map/iu', $text)) return 'sns';
    if (preg_match('/AI|効率化|システム|自動化|DX|チャットボット/iu', $text)) return 'ai';
    if (preg_match('/予約/u', $text)) return 'reservation';
    if (preg_match('/アプリ/u', $text)) return 'app';
    if (preg_match('/カメラ|防犯/u', $text)) return 'camera';
    if (preg_match('/採用|自社求人|御社で働|応募/u', $text)) return 'recruit';
    if (preg_match('/代理店|パートナー|協業/u', $text)) return 'partner';
    return 'other';
}

function detect_intent_hint(string $text): string {
    $category = detect_category($text);
    if ($category !== 'other') return '';

    if (preg_match('/月額|月いくら|毎月|料金|費用|価格|値段|いくら|コスト|金額|見積|見積もり|見積り|お金|プラン料金/u', $text)) {
        return '料金・月額についての質問。対象サービスが会話履歴からも特定できなければ、サービス選択メニューを出す。';
    }
    if (preg_match('/納期|期間|何日|何週間|何か月|何ヶ月|どれくらい|どのくらい|いつできる|いつ完成|いつから|開始時期|制作日数|導入まで/u', $text)) {
        return '納期・制作期間・導入期間についての質問。対象サービスが特定できなければ、サービス選択メニューを出す。';
    }
    if (preg_match('/できる|可能|対応|使える|連携|つなげ|機能|できますか|できる？/u', $text)) {
        return '対応可否・機能についての質問。直前の会話文脈を優先して対象サービスを判断する。';
    }
    return '';
}

function call_gemini(string $apiKey, array $payload): array {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return ['status' => 0, 'body' => '', 'error' => 'encode_failed'];

    $headers = ['Content-Type: application/json','x-goog-api-key: ' . $apiKey,'x-goog-api-client: next-japan-innovation-chatbot/1.0'];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>20,CURLOPT_HTTPHEADER=>$headers,CURLOPT_POSTFIELDS=>$json]);
        $body = curl_exec($ch);
        $error = curl_error($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status'=>$status,'body'=>is_string($body)?$body:'','error'=>$error];
    }

    $context = stream_context_create(['http'=>['method'=>'POST','timeout'=>20,'ignore_errors'=>true,'header'=>implode("\r\n",$headers)."\r\n",'content'=>$json]]);
    $body = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header) && isset($http_response_header[0])) {
        if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $status = (int)$m[1];
    }
    return ['status'=>$status,'body'=>is_string($body)?$body:'','error'=>$body===false?'http_failed':''];
}

function extract_gemini_text(array $response): string {
    $parts = $response['candidates'][0]['content']['parts'] ?? null;
    if (!is_array($parts)) return '';
    $texts = [];
    foreach ($parts as $part) if (is_array($part) && isset($part['text']) && is_string($part['text'])) $texts[] = $part['text'];
    return trim(implode("\n", $texts));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond_json(405, ['ok'=>false,'code'=>'METHOD_NOT_ALLOWED']);
check_origin();
enforce_rate_limit();

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) respond_json(415, ['ok'=>false,'code'=>'JSON_REQUIRED']);

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 24000) respond_json(413, ['ok'=>false,'code'=>'PAYLOAD_TOO_LARGE']);
$request = json_decode($raw, true);
if (!is_array($request)) respond_json(400, ['ok'=>false,'code'=>'INVALID_JSON']);

$message = trim((string)($request['message'] ?? ''));
if ($message === '') respond_json(400, ['ok'=>false,'code'=>'MESSAGE_REQUIRED']);
if (text_length($message) > 800) respond_json(400, ['ok'=>false,'code'=>'MESSAGE_TOO_LONG','message'=>'質問は800文字以内で入力してください。']);

if (contains_sensitive_input($message)) {
    respond_json(200, ['ok'=>true,'answer'=>'個人情報を含む内容はAIには送信していません。お名前・電話番号・メールアドレスなどは、お問い合わせフォームへ直接ご入力ください。','category'=>detect_category($message),'action'=>'none','pending_intent'=>'','suggest_contact'=>true]);
}

$contents = [];
$historyRaw = $request['history'] ?? [];
if (is_array($historyRaw)) {
    foreach (array_slice($historyRaw, -10) as $item) {
        if (!is_array($item)) continue;
        $role = (string)($item['role'] ?? '');
        $content = trim((string)($item['content'] ?? ''));
        if (($role !== 'user' && $role !== 'assistant') || $content === '') continue;
        $contents[] = ['role'=>$role==='assistant'?'model':'user','parts'=>[['text'=>trim_text(redact_sensitive_input($content),1200)]]];
    }
}

$intentHint = detect_intent_hint($message);
$userTextForModel = $message;
if ($intentHint !== '') {
    $userTextForModel .= "\n\n【内部意図補足】\n" . $intentHint . "\nこの補足文は利用者には見せず、回答文にも引用しないこと。";
}
$contents[] = ['role'=>'user','parts'=>[['text'=>$userTextForModel]]];

$apiKey = get_api_key();
if ($apiKey === '') respond_json(503, ['ok'=>false,'code'=>'AI_NOT_CONFIGURED','message'=>'現在AI回答を準備中です。メニューまたはお問い合わせフォームをご利用ください。']);

$knowledge = get_nji_knowledge();
$knowledgeBlock = $knowledge !== '' ? "\n\n【NJI専用知識データ】\n" . $knowledge : '';

$instructions = <<<'PROMPT'
あなたは株式会社Next Japan Innovation（NJI）の公式Webサイトにいる「NJI・chatBOTくん」です。
NJIの受付・営業サポート担当として、ChatGPTのように会話の文脈を理解し、自然で柔軟に受け答えしてください。

【会話スタイル】
- 必ず日本語で回答する。
- 丁寧だが硬すぎない。会社スタッフがその場で自然に案内しているように話す。
- 同じ意味の質問でも毎回まったく同じ言い回しを繰り返さない。
- 短文、口語、省略、言い切り、語尾だけの質問でも意味を推測して自然に処理する。
- 「承ります」「個別条件は担当者が確認します」だけで会話を終わらせない。
- 回答は通常2〜5文程度。必要なら短い追加質問を1つ行う。
- 知識データにある事実・料金・対応可否を最優先し、事実そのものは言い換えても変更しない。
- 「ASK」は内部管理用語なので利用者には表示しない。
- Markdown記号やコードブロックは使わない。

【最重要：表現の揺れを吸収する】
利用者は完全な文章で質問するとは限りません。意味が同じなら同じ意図として扱ってください。
例：
「月額はいくらですか？」「月額は？」「月いくら？」「毎月いくら？」「料金は？」「値段は？」「費用は？」「いくら？」「金額は？」「コストは？」→ すべて料金・月額の質問。
「納期は？」「期間は？」「何日？」「どのくらい？」「いつできる？」「完成いつ？」→ すべて制作・導入期間の質問。
「できる？」「対応してる？」「使える？」「連携できる？」→ 直前の話題に対する対応可否・機能の質問。
誤字や多少の言い回し違いがあっても、文脈から意味が明確なら聞き返さず回答してください。

【情報が足りない質問への対応】
料金・納期・機能などの意図は分かるが、対象サービスを質問文や会話履歴から特定できない場合は、勝手にサービスを決めず自然に聞き返してください。
その場合は answer で「どちらのサービスについてでしょうか？」など自然に案内し、action を "show_service_menu" にしてください。
pending_intent には、利用者が知りたい内容を短く入れてください。例："月額料金"、"料金・見積り"、"導入・制作期間"、"機能"。
対象サービスが質問文または直前の会話から明確な場合は、メニューを出さず、そのサービスについて直接回答してください。

例：
利用者「月額は？」
→ answer「月額料金ですね。どちらのサービスについてでしょうか？」
→ action="show_service_menu", pending_intent="月額料金"

利用者「ホームページの月額は？」
→ 知識データにあるホームページ料金を自然に回答。action="none"

利用者「AIチャットボットくん、月いくら？」
→ AIチャットボットくんの料金情報を自然に回答。action="none"

【会話の文脈】
- 直前までホームページ制作について話していて、その後「制作期間は？」と聞かれた場合は、ホームページ制作の期間として回答する。
- 利用者がメニュー選択後に「月額は？」「納期は？」「それできる？」のように短く続けても、直前の選択サービスを引き継ぐ。
- 不要な聞き返しはしない。対象が特定できるならそのまま答える。

【料金・見積り】
- 知識データに具体的な料金帯が登録されている場合は、その金額を案内してよい。
- 「料金は内容によって異なるため回答できません」と一律に逃げない。
- 知識データにない具体的金額を推測しない。
- 概算や料金帯はAIが案内してよい。正式な見積りは担当者確認であることを必要に応じて添える。
- 料金が構築内容によって変わる商品は、自然に「内容によって変わるため詳しくはお問い合わせください」などと案内する。

【対応可否】
- 知識データで「対応可能」とされている機能は、担当者確認だけで終わらせず、何ができるか具体的に説明する。
- 知識データで「対応不可」とされている機能は、できると答えない。
- 非推奨の機能は理由と代替案があれば簡潔に案内する。

【問い合わせ誘導】
- 知識データに答えがある一般的な質問では、毎回問い合わせボタンを出す必要はない。
- 料金が要相談の機能、正式見積り、契約条件、個別案件、具体的な求人、担当者による確認が必要な内容では suggest_contact=true にしてよい。
- 単なる料金帯・営業時間・機能説明など、知識データだけで十分回答できる場合は原則 suggest_contact=false。

【安全・制約】
- 個人情報、カード情報、パスワードなどをチャット内で求めない。
- 契約・正式な申込みをAIが受理したと表現しない。
- 法律・税務・医療などの専門判断は行わない。
- NJIと無関係な一般雑談には深入りせず、必要ならNJIのサービス相談へ自然に戻す。

必ずJSONだけを返してください。コードブロックは付けないでください。
形式：
{"answer":"利用者への回答","category":"web","action":"none","pending_intent":"","suggest_contact":false}

category は web, sns, ai, reservation, camera, app, placement, recruit, partner, other のいずれか。
action は "none" または "show_service_menu" のいずれか。
pending_intent は action="show_service_menu" のときだけ短い日本語を入れ、それ以外は空文字にしてください。
PROMPT;

$instructions .= $knowledgeBlock;

$payload = ['systemInstruction'=>['parts'=>[['text'=>$instructions]]],'contents'=>$contents,'generationConfig'=>['temperature'=>0.65,'maxOutputTokens'=>650,'responseMimeType'=>'application/json']];
$result = call_gemini($apiKey, $payload);
$status = (int)($result['status'] ?? 0);
$body = (string)($result['body'] ?? '');

if ($status < 200 || $status >= 300 || $body === '') {
    error_log('NJI chatbot Gemini request failed. HTTP=' . $status);
    $clientStatus = $status === 429 ? 429 : 502;
    respond_json($clientStatus, ['ok'=>false,'code'=>$status===429?'AI_RATE_LIMIT':'AI_UNAVAILABLE','message'=>'AI回答を取得できませんでした。メニューまたはお問い合わせフォームをご利用ください。']);
}

$response = json_decode($body, true);
if (!is_array($response)) respond_json(502, ['ok'=>false,'code'=>'AI_INVALID_RESPONSE']);
$outputText = extract_gemini_text($response);
if ($outputText === '') respond_json(502, ['ok'=>false,'code'=>'AI_EMPTY_RESPONSE']);

$structured = json_decode($outputText, true);
if (!is_array($structured)) $structured = ['answer'=>$outputText,'category'=>detect_category($message),'action'=>'none','pending_intent'=>'','suggest_contact'=>false];

$answer = trim((string)($structured['answer'] ?? ''));
$category = (string)($structured['category'] ?? detect_category($message));
$action = (string)($structured['action'] ?? 'none');
$pendingIntent = trim((string)($structured['pending_intent'] ?? ''));
$suggestContact = (bool)($structured['suggest_contact'] ?? false);

$allowedCategories = ['web','sns','ai','reservation','camera','app','placement','recruit','partner','other'];
if (!in_array($category, $allowedCategories, true)) $category = 'other';
$allowedActions = ['none','show_service_menu'];
if (!in_array($action, $allowedActions, true)) $action = 'none';
if ($action !== 'show_service_menu') $pendingIntent = '';
$pendingIntent = trim_text($pendingIntent, 80);
if ($answer === '') $answer = $action === 'show_service_menu' ? 'どちらのサービスについてでしょうか？' : 'もう少し詳しく教えていただけますか？';

respond_json(200, ['ok'=>true,'answer'=>trim_text($answer,1800),'category'=>$category,'action'=>$action,'pending_intent'=>$pendingIntent,'suggest_contact'=>$suggestContact]);
