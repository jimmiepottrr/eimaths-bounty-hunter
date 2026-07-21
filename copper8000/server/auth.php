<?php
/**
 * auth.php — POST {action:'signup'|'login', ...} · GET (Bearer) = me
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  json_out(['user' => user_public(require_auth())]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'signup') {
  $email = strtolower(trim((string) ($body['email'] ?? '')));
  $password = (string) ($body['password'] ?? '');
  $name = trim((string) ($body['name'] ?? ''));
  $phone = trim((string) ($body['phone'] ?? ''));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('รูปแบบอีเมลไม่ถูกต้อง');
  if (mb_strlen($password) < 6) json_err('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
  if ($name === '') json_err('กรุณากรอกชื่อ');

  $st = pdo()->prepare('SELECT id FROM users WHERE email = ?');
  $st->execute([$email]);
  if ($st->fetch()) json_err('อีเมลนี้ถูกใช้สมัครแล้ว', 409);

  pdo()->prepare(
    "INSERT INTO users (email, password_hash, name, phone, role, approved) VALUES (?, ?, ?, ?, 'user', 0)"
  )->execute([$email, password_hash($password, PASSWORD_DEFAULT), $name, $phone]);
  $userId = (int) pdo()->lastInsertId();

  $st = pdo()->prepare('SELECT * FROM users WHERE id = ?');
  $st->execute([$userId]);
  json_out(['token' => new_session($userId), 'user' => user_public($st->fetch())], 201);
}

if ($action === 'login') {
  $email = strtolower(trim((string) ($body['email'] ?? '')));
  $password = (string) ($body['password'] ?? '');

  $st = pdo()->prepare('SELECT * FROM users WHERE email = ?');
  $st->execute([$email]);
  $user = $st->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) {
    json_err('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  json_out(['token' => new_session((int) $user['id']), 'user' => user_public($user)]);
}

json_err('action ไม่ถูกต้อง');
