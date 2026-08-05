<?php
/**
 * auth.php — POST {action:'signup'|'login'|'change_password', ...} · GET (Bearer) = me
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

  // referral code (ไม่บังคับ) — ผูกลูกค้าเข้ากับ agent ที่เป็นเจ้าของโค้ด
  $referral = strtoupper(trim((string) ($body['referral_code'] ?? '')));
  $agentId = null;
  if ($referral !== '') {
    $st = pdo()->prepare("SELECT id FROM users WHERE referral_code = ? AND role = 'agent'");
    $st->execute([$referral]);
    $agentRow = $st->fetch();
    if (!$agentRow) json_err('รหัสแนะนำ (referral) ไม่ถูกต้อง');
    $agentId = (int) $agentRow['id'];
  }

  $st = pdo()->prepare('SELECT id FROM users WHERE email = ?');
  $st->execute([$email]);
  if ($st->fetch()) json_err('อีเมลนี้ถูกใช้สมัครแล้ว', 409);

  pdo()->prepare(
    "INSERT INTO users (email, password_hash, name, phone, role, approved, agent_id) VALUES (?, ?, ?, ?, 'user', 0, ?)"
  )->execute([$email, password_hash($password, PASSWORD_DEFAULT), $name, $phone, $agentId]);
  $userId = (int) pdo()->lastInsertId();

  $st = pdo()->prepare('SELECT * FROM users WHERE id = ?');
  $st->execute([$userId]);
  $newUser = $st->fetch();
  audit_log('signup', ['user' => $newUser, 'entity' => 'user', 'entity_id' => $userId, 'detail' => ['email' => $email, 'name' => $name, 'agent_id' => $agentId]]);
  json_out(['token' => new_session($userId), 'user' => user_public($newUser)], 201);
}

if ($action === 'login') {
  $email = strtolower(trim((string) ($body['email'] ?? '')));
  $password = (string) ($body['password'] ?? '');

  $st = pdo()->prepare('SELECT * FROM users WHERE email = ?');
  $st->execute([$email]);
  $user = $st->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) {
    // บันทึกความพยายามล็อกอินที่ล้มเหลว (เก็บอีเมลที่กรอก ไม่เก็บรหัสผ่าน) — ช่วยจับ brute force
    audit_log('login_failed', ['actor_role' => 'guest', 'entity' => 'user', 'detail' => ['email' => $email]]);
    json_err('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  audit_log('login', ['user' => $user, 'entity' => 'user', 'entity_id' => (int) $user['id']]);
  json_out(['token' => new_session((int) $user['id']), 'user' => user_public($user)]);
}

if ($action === 'change_password') {
  $user = require_auth();
  $current = (string) ($body['current_password'] ?? '');
  $new = (string) ($body['new_password'] ?? '');
  if (mb_strlen($new) < 6) json_err('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
  if (!password_verify($current, $user['password_hash'])) json_err('รหัสผ่านปัจจุบันไม่ถูกต้อง');
  pdo()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($new, PASSWORD_DEFAULT), (int) $user['id']]);
  audit_log('change_password', ['user' => $user, 'entity' => 'user', 'entity_id' => (int) $user['id']]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
