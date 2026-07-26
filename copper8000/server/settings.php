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

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $mode = get_setting('announce_mode', 'marquee');
  if (!in_array($mode, VALID_ANNOUNCE_MODES, true)) $mode = 'marquee';
  json_out(['settings' => [
    'theme' => get_setting('theme', 'gold'),
    'announcement' => [
      'text' => get_setting('announce_text', ''),
      'mode' => $mode,
      'active' => get_setting('announce_active', '0') === '1',
    ],
  ]]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

require_admin();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'set_theme') {
  $theme = (string) ($body['theme'] ?? '');
  if (!in_array($theme, VALID_THEMES, true)) json_err('ธีมไม่ถูกต้อง');
  set_setting('theme', $theme);
  json_out([]);
}

if ($action === 'set_announcement') {
  $text = trim((string) ($body['text'] ?? ''));
  if (mb_strlen($text) > ANNOUNCE_MAX_LEN) json_err('ข้อความประกาศยาวเกินไป (สูงสุด ' . ANNOUNCE_MAX_LEN . ' ตัวอักษร)');
  $mode = (string) ($body['mode'] ?? '');
  if (!in_array($mode, VALID_ANNOUNCE_MODES, true)) json_err('รูปแบบการแสดงไม่ถูกต้อง');
  $active = !empty($body['active']) ? '1' : '0';
  set_setting('announce_text', $text);
  set_setting('announce_mode', $mode);
  set_setting('announce_active', $active);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
