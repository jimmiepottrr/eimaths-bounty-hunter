<?php
/**
 * languages.php — รายชื่อภาษา + จัดการภาษา (เพิ่ม/แก้/เปิดปิด/ลบ)
 * GET (API key) = เฉพาะ enabled · GET ?all=1 (admin) = ทุกแถว
 * POST (admin): {action:'add'|'update'|'set_enabled'|'delete', ...}
 * หมายเหตุ: ภาษา built-in (th/en/zh) dict อยู่ในตัวเว็บ — DB เก็บเฉพาะสถานะ; ภาษาที่เพิ่มเองเก็บ dict JSON เต็ม
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();

function language_public(array $l): array {
  return [
    'code'        => $l['code'],
    'name_native' => $l['name_native'],
    'enabled'     => (bool) $l['enabled'],
    'built_in'    => (bool) $l['built_in'],
    'sort_order'  => (int) $l['sort_order'],
    'dict'        => $l['dict'] !== null ? json_decode($l['dict'], true) : null,
  ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  if (($_GET['all'] ?? '') === '1') {
    require_admin();
    $rows = pdo()->query('SELECT * FROM languages ORDER BY sort_order, code')->fetchAll();
  } else {
    $rows = pdo()->query('SELECT * FROM languages WHERE enabled = 1 ORDER BY sort_order, code')->fetchAll();
  }
  json_out(['languages' => array_map('language_public', $rows)]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

require_admin();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

/** dict ต้องเป็น object ของ string ทั้งหมด */
function validate_dict(mixed $dict): ?string {
  if (!is_array($dict) || array_is_list($dict)) return null;
  foreach ($dict as $v) {
    if (!is_string($v)) return null;
  }
  return json_encode($dict, JSON_UNESCAPED_UNICODE);
}

if ($action === 'add') {
  $code = strtolower(trim((string) ($body['code'] ?? '')));
  $name = trim((string) ($body['name_native'] ?? ''));
  if (!preg_match('/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/', $code)) json_err('รหัสภาษาไม่ถูกต้อง');
  if ($name === '') json_err('กรุณากรอกชื่อภาษา');
  $dictJson = validate_dict($body['dict'] ?? null);
  if ($dictJson === null) json_err('รูปแบบ JSON ไม่ถูกต้อง (ทุกค่าต้องเป็นข้อความ)');

  $st = pdo()->prepare('SELECT code FROM languages WHERE code = ?');
  $st->execute([$code]);
  if ($st->fetch()) json_err('ภาษานี้มีอยู่แล้ว', 409);

  $max = (int) pdo()->query('SELECT COALESCE(MAX(sort_order),0) FROM languages')->fetchColumn();
  pdo()->prepare(
    'INSERT INTO languages (code, name_native, dict, enabled, built_in, sort_order) VALUES (?, ?, ?, 1, 0, ?)'
  )->execute([$code, $name, $dictJson, $max + 1]);
  json_out([], 201);
}

if ($action === 'update') {
  $code = strtolower(trim((string) ($body['code'] ?? '')));
  $st = pdo()->prepare('SELECT * FROM languages WHERE code = ?');
  $st->execute([$code]);
  $language = $st->fetch();
  if (!$language) json_err('ไม่พบภาษา', 404);

  if (array_key_exists('dict', $body)) {
    if ((bool) $language['built_in']) json_err('ภาษาหลักแก้คำแปลไม่ได้');
    $dictJson = validate_dict($body['dict']);
    if ($dictJson === null) json_err('รูปแบบ JSON ไม่ถูกต้อง (ทุกค่าต้องเป็นข้อความ)');
    pdo()->prepare('UPDATE languages SET dict = ? WHERE code = ?')->execute([$dictJson, $code]);
  }
  if (array_key_exists('name_native', $body)) {
    $name = trim((string) $body['name_native']);
    if ($name === '') json_err('กรุณากรอกชื่อภาษา');
    pdo()->prepare('UPDATE languages SET name_native = ? WHERE code = ?')->execute([$name, $code]);
  }
  json_out([]);
}

if ($action === 'set_enabled') {
  $code = strtolower(trim((string) ($body['code'] ?? '')));
  $enabled = (bool) ($body['enabled'] ?? false);
  $st = pdo()->prepare('SELECT * FROM languages WHERE code = ?');
  $st->execute([$code]);
  if (!$st->fetch()) json_err('ไม่พบภาษา', 404);
  if (!$enabled) {
    $others = pdo()->prepare('SELECT COUNT(*) FROM languages WHERE enabled = 1 AND code != ?');
    $others->execute([$code]);
    if ((int) $others->fetchColumn() === 0) json_err('ต้องมีอย่างน้อย 1 ภาษาที่เปิดใช้งาน');
  }
  pdo()->prepare('UPDATE languages SET enabled = ? WHERE code = ?')->execute([$enabled ? 1 : 0, $code]);
  json_out([]);
}

if ($action === 'delete') {
  $code = strtolower(trim((string) ($body['code'] ?? '')));
  $st = pdo()->prepare('SELECT * FROM languages WHERE code = ?');
  $st->execute([$code]);
  $language = $st->fetch();
  if (!$language) json_err('ไม่พบภาษา', 404);
  if ((bool) $language['built_in']) json_err('ภาษาหลักลบไม่ได้ (ปิดการใช้งานแทน)');
  if ((bool) $language['enabled']) {
    $others = pdo()->prepare('SELECT COUNT(*) FROM languages WHERE enabled = 1 AND code != ?');
    $others->execute([$code]);
    if ((int) $others->fetchColumn() === 0) json_err('ต้องมีอย่างน้อย 1 ภาษาที่เปิดใช้งาน');
  }
  pdo()->prepare('DELETE FROM languages WHERE code = ?')->execute([$code]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
