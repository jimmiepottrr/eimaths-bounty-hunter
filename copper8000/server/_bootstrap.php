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
     WHERE s.token = ? AND s.expires_at > NOW() AND u.deleted_at IS NULL'
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

// ---------- Settings (key-value) — ใช้ร่วมกันทุก endpoint ----------
function get_setting(string $key, string $default): string {
  $st = pdo()->prepare('SELECT sval FROM settings WHERE skey = ?');
  $st->execute([$key]);
  $row = $st->fetch();
  return $row ? (string) $row['sval'] : $default;
}
function set_setting(string $key, string $value): void {
  pdo()->prepare('INSERT INTO settings (skey, sval) VALUES (?, ?) ON DUPLICATE KEY UPDATE sval = VALUES(sval)')
    ->execute([$key, $value]);
}

// ---------- Audit log (บันทึกการใช้งาน) ----------
/** IP ผู้เรียก — ใช้ REMOTE_ADDR เป็นหลัก (ปลอมยาก) ตัดความยาวกัน overflow */
function client_ip(): string {
  return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

/**
 * บันทึกเหตุการณ์ลงตาราง audit_log — เรียกก่อน json_out เสมอ (json_out จะ exit)
 * $opts: user(array แถว user) | user_id, actor_email, actor_role, entity, entity_id, detail(array|string)
 * ห้ามให้ audit ล้มแล้วทำ request หลักพัง → จับ error เงียบ
 */
function audit_log(string $action, array $opts = []): void {
  try {
    $user  = $opts['user'] ?? null;
    $uid   = isset($opts['user_id']) ? (int) $opts['user_id'] : ($user ? (int) $user['id'] : null);
    $email = $opts['actor_email'] ?? ($user['email'] ?? null);
    $role  = $opts['actor_role']  ?? ($user['role']  ?? 'guest');
    $detail = $opts['detail'] ?? null;
    if (is_array($detail)) $detail = json_encode($detail, JSON_UNESCAPED_UNICODE);
    $ua = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
    pdo()->prepare(
      'INSERT INTO audit_log (user_id, actor_email, actor_role, action, entity, entity_id, detail, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
      $uid, $email, $role, $action,
      $opts['entity'] ?? null,
      isset($opts['entity_id']) ? (int) $opts['entity_id'] : null,
      $detail, client_ip(), $ua,
    ]);
  } catch (Throwable $e) {
    error_log('[Copper8000Audit] ' . $e->getMessage());
  }
}

// ---------- Serializers (ให้ type ตรงกับ frontend) ----------
function user_public(array $u): array {
  return [
    'id'              => (int) $u['id'],
    'email'           => $u['email'],
    'name'            => $u['name'],
    'phone'           => $u['phone'],
    'role'            => $u['role'],
    'approved'        => (bool) $u['approved'],
    'agent_id'        => isset($u['agent_id']) && $u['agent_id'] !== null ? (int) $u['agent_id'] : null,
    'referral_code'   => $u['referral_code'] ?? null,
    'commission_rate' => isset($u['commission_rate']) ? (float) $u['commission_rate'] : 0,
    'credit_balance'  => isset($u['credit_balance']) ? (float) $u['credit_balance'] : 0,
    'credit_held'     => isset($u['credit_held']) ? (float) $u['credit_held'] : 0,
    'warnings'        => isset($u['warnings']) ? (int) $u['warnings'] : 0,
    'booking_suspended' => (bool) ($u['booking_suspended'] ?? false),
    'pending_commission_rate' => isset($u['pending_commission_rate']) && $u['pending_commission_rate'] !== null ? (float) $u['pending_commission_rate'] : null,
    'pending_rate_from' => $u['pending_rate_from'] ?? null,
    'deleted_at'      => isset($u['deleted_at']) && $u['deleted_at'] !== null ? str_replace(' ', 'T', $u['deleted_at']) : null,
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
    'sort_order'        => (int) ($p['sort_order'] ?? 0),
    'active'            => (bool) ($p['active'] ?? true),
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
    'deposit_held'     => isset($b['deposit_held']) ? (float) $b['deposit_held'] : 0,
    'delivery_date'    => $b['delivery_date'] ?? null,
    'actual_weight_kg' => isset($b['actual_weight_kg']) ? (float) $b['actual_weight_kg'] : null,
    'qc_weight_kg'     => isset($b['qc_weight_kg']) ? (float) $b['qc_weight_kg'] : null,
    'created_at'       => str_replace(' ', 'T', $b['created_at']),
    'confirmed_at'     => isset($b['confirmed_at']) && $b['confirmed_at'] !== null ? str_replace(' ', 'T', $b['confirmed_at']) : null,
    'commission_agent_id' => isset($b['commission_agent_id']) && $b['commission_agent_id'] !== null ? (int) $b['commission_agent_id'] : null,
    'commission_rate'  => isset($b['commission_rate']) && $b['commission_rate'] !== null ? (float) $b['commission_rate'] : null,
    'commission_amount' => isset($b['commission_amount']) && $b['commission_amount'] !== null ? (float) $b['commission_amount'] : null,
  ];
}

// ---------- ค่าคอมรายเดือน: เวลาไทย + ล็อกตัวเลข ----------
// confirmed_at เก็บเป็นเวลาไทย (DB/PHP เป็น UTC) เพื่อตัดรอบเดือนตามเวลาไทยจริง

/** ห้ามแก้/ลบภายใน 1 เดือนหลังเกิดค่าคอม */
const COMMISSION_LOCK_DAYS = 30;

function bkk_now(): DateTimeImmutable {
  return new DateTimeImmutable('now', new DateTimeZone('Asia/Bangkok'));
}

function bkk_now_str(): string {
  return bkk_now()->format('Y-m-d H:i:s');
}

function bkk_current_month(): string {
  return bkk_now()->format('Y-m');
}

/** วันที่ 1 ของเดือนถัดไป (เวลาไทย) — วันที่ % ค่าคอมใหม่เริ่มมีผล */
function bkk_first_of_next_month(): string {
  return bkk_now()->modify('first day of next month')->format('Y-m-d');
}

/** % ใหม่ที่ตั้งไว้ล่วงหน้า → ถึงวันมีผลแล้วให้กลายเป็น % ปัจจุบัน */
function promote_due_commission_rates(): void {
  pdo()->prepare(
    "UPDATE users SET commission_rate = pending_commission_rate, pending_commission_rate = NULL, pending_rate_from = NULL
     WHERE role = 'agent' AND pending_rate_from IS NOT NULL AND pending_commission_rate IS NOT NULL AND pending_rate_from <= ?"
  )->execute([bkk_now()->format('Y-m-d')]);
}

/** "3.00,5.00" (GROUP_CONCAT) → [3.0, 5.0] */
function rates_list(?string $csv): array {
  if ($csv === null || $csv === '') return [];
  return array_values(array_map('floatval', explode(',', $csv)));
}
