<?php
/**
 * settings.php — ตั้งค่าเว็บ (ตอนนี้มีธีมสี)
 * GET (API key) → {ok, settings:{theme}} · POST (admin) {action:'set_theme', theme}
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();

const VALID_THEMES = ['gold', 'copper', 'silver'];

function get_setting(string $key, string $default): string {
  $st = pdo()->prepare('SELECT sval FROM settings WHERE skey = ?');
  $st->execute([$key]);
  $row = $st->fetch();
  return $row ? (string) $row['sval'] : $default;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  json_out(['settings' => ['theme' => get_setting('theme', 'gold')]]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

require_admin();

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'set_theme') {
  $theme = (string) ($body['theme'] ?? '');
  if (!in_array($theme, VALID_THEMES, true)) json_err('ธีมไม่ถูกต้อง');
  pdo()->prepare('INSERT INTO settings (skey, sval) VALUES (?, ?) ON DUPLICATE KEY UPDATE sval = VALUES(sval)')
    ->execute(['theme', $theme]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
