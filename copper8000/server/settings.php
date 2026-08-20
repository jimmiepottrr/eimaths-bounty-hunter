<?php
/**
 * settings.php — ตั้งค่าเว็บ (ธีมสี + ข้อความประกาศ)
 * GET (API key) → {ok, settings:{theme, announcement}}
 * POST (admin) {action:'set_theme', theme} | {action:'set_announcement', text, mode, active}
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();

const VALID_THEMES = ['gold', 'copper', 'silver'];
const VALID_ANNOUNCE_MODES = ['marquee', 'popup'];
const ANNOUNCE_MAX_LEN = 500;

// get_setting / set_setting ย้ายไปอยู่ใน _bootstrap.php (ใช้ร่วมกันทุก endpoint)

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/** ข้อความประกาศเก็บเป็น JSON {langCode: text} (รองรับทุกภาษา) — ของเก่าเป็น string = ภาษาไทย */
function announce_text_map(): array {
  $raw = get_setting('announce_text', '');
  $decoded = json_decode($raw, true);
  if (!is_array($decoded)) return $raw !== '' ? ['th' => $raw] : [];
  $out = [];
  foreach ($decoded as $lc => $v) {
    if (is_string($lc) && preg_match('/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/', $lc)) {
      $out[$lc] = (string) $v;
    }
  }
  return $out;
}

if ($method === 'GET') {
  $mode = get_setting('announce_mode', 'marquee');
  if (!in_array($mode, VALID_ANNOUNCE_MODES, true)) $mode = 'marquee';
  json_out(['settings' => [
    'theme' => get_setting('theme', 'gold'),
    'announcement' => [
      'text' => announce_text_map(),
      'mode' => $mode,
      'active' => get_setting('announce_active', '0') === '1',
    ],
    'booking_deposit' => (float) get_setting('booking_deposit', '0'),
    'default_credit' => (float) get_setting('default_credit', '0'),
  ]]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

$admin = require_admin();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'set_theme') {
  $theme = (string) ($body['theme'] ?? '');
  if (!in_array($theme, VALID_THEMES, true)) json_err('ธีมไม่ถูกต้อง');
  set_setting('theme', $theme);
  audit_log('set_theme', ['user' => $admin, 'entity' => 'settings', 'detail' => ['theme' => $theme]]);
  json_out([]);
}

if ($action === 'set_announcement') {
  $textIn = $body['text'] ?? [];
  if (!is_array($textIn)) $textIn = ['th' => (string) $textIn];
  $map = [];
  foreach ($textIn as $lc => $val) {
    if (!is_string($lc) || !preg_match('/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/', $lc)) continue;
    $v = trim((string) $val);
    if ($v === '') continue; // เก็บเฉพาะภาษาที่มีข้อความ
    if (mb_strlen($v) > ANNOUNCE_MAX_LEN) {
      json_err('ข้อความประกาศยาวเกินไป (สูงสุด ' . ANNOUNCE_MAX_LEN . ' ตัวอักษร)');
    }
    $map[$lc] = $v;
  }
  $mode = (string) ($body['mode'] ?? '');
  if (!in_array($mode, VALID_ANNOUNCE_MODES, true)) json_err('รูปแบบการแสดงไม่ถูกต้อง');
  $active = !empty($body['active']) ? '1' : '0';
  set_setting('announce_text', json_encode($map, JSON_UNESCAPED_UNICODE));
  set_setting('announce_mode', $mode);
  set_setting('announce_active', $active);
  audit_log('set_announcement', ['user' => $admin, 'entity' => 'settings', 'detail' => ['mode' => $mode, 'active' => $active === '1', 'langs' => array_keys($map)]]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
