<?php
/**
 * _bootstrap.php — โหลด config, CORS, JSON helpers, API key, DB, auth
 * ทุก endpoint require ไฟล์นี้เป็นบรรทัดแรก (pattern เดียวกับ bounty api)
 */
declare(strict_types=1);

$__cfg = __DIR__ . '/config.php';
if (!file_exists($__cfg)) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => 'ยังไม่ได้ตั้งค่า: คัดลอก config.example.php เป็น config.php แล้วกรอกค่าจริง'], JSON_UNESCAPED_UNICODE);
  exit;
}
require $__cfg;

// ---------- Error handling: ไม่ leak รายละเอียดภายใน ----------
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e): void {
  error_log('[Copper8000API] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => 'เกิดข้อผิดพลาดภายในระบบ'], JSON_UNESCAPED_UNICODE);
  exit;
});

// ---------- CORS ----------
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

// ---------- JSON helpers ----------
function json_out(array $data, int $code = 200): void {
  http_response_code($code);
  echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
  exit;
}
function json_err(string $msg, int $code = 400): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}
function read_json_body(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

// ---------- ตรวจ API key (ทุก endpoint) ----------
function api_key_check(): void {
  $key = $_SERVER['HTTP_X_API_KEY'] ?? '';
  if (!hash_equals(API_KEY, $key)) json_err('API key ไม่ถูกต้อง', 401);
}

// ---------- PDO ----------
function pdo(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $pdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
      DB_USER, DB_PASS,
      [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
      ]
    );
  }
  return $pdo;
}

// ---------- Auth ----------
function bearer_token(): string {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if ($header === '' && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  }
  return preg_match('/^Bearer\s+(\S+)$/i', $header, $m) ? $m[1] : '';
}

/** คืนแถว user ของโทเคนปัจจุบัน — ไม่ผ่าน = 401 */
function require_auth(): array {
  $token = bearer_token();
  if ($token === '') json_err('กรุณาเข้าสู่ระบบ', 401);
  $st = pdo()->prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()'
  );
  $st->execute([$token]);
  $user = $st->fetch();
  if (!$user) json_err('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
  return $user;
}

function require_admin(): array {
  $user = require_auth();
  if ($user['role'] !== 'admin') json_err('เฉพาะผู้ดูแลระบบเท่านั้น', 403);
  return $user;
}

function new_session(int $userId): string {
  $token = bin2hex(random_bytes(32));
  pdo()->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))')
    ->execute([$token, $userId, TOKEN_TTL_DAYS]);
  return $token;
}

// ---------- Serializers (ให้ type ตรงกับ frontend) ----------
function user_public(array $u): array {
  return [
    'id'       => (int) $u['id'],
    'email'    => $u['email'],
    'name'     => $u['name'],
    'phone'    => $u['phone'],
    'role'     => $u['role'],
    'approved' => (bool) $u['approved'],
  ];
}

function product_public(array $p): array {
  return [
    'id'                => (int) $p['id'],
    'material'          => $p['material'],
    'name_th'           => $p['name_th'],
    'name_en'           => $p['name_en'],
    'price_per_kg'      => (float) $p['price_per_kg'],
    'prev_price_per_kg' => (float) $p['prev_price_per_kg'],
    'high_of_day'       => (float) $p['high_of_day'],
    'low_of_day'        => (float) $p['low_of_day'],
    'updated_at'        => str_replace(' ', 'T', $p['updated_at']),
  ];
}

function booking_public(array $b): array {
  return [
    'id'               => (int) $b['id'],
    'user_id'          => (int) $b['user_id'],
    'user_name'        => $b['user_name'] ?? null,
    'product_id'       => (int) $b['product_id'],
    'product_name'     => $b['product_name'],
    'product_name_en'  => $b['product_name_en'] ?? null,
    'quantity'         => (float) $b['quantity'],
    'unit'             => $b['unit'],
    'price_at_booking' => (float) $b['price_at_booking'],
    'total_estimate'   => (float) $b['total_estimate'],
    'status'           => $b['status'],
    'created_at'       => str_replace(' ', 'T', $b['created_at']),
  ];
}
