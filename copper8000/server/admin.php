<?php
/**
 * admin.php — เฉพาะ role=admin
 * GET  ?view=pending_users | ?view=bookings
 * POST {action:'set_approval'|'confirm_booking'|'update_price', ...}
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();
require_admin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $view = (string) ($_GET['view'] ?? '');

  if ($view === 'pending_users') {
    $rows = pdo()->query(
      "SELECT * FROM users WHERE role = 'user' AND approved = 0 ORDER BY created_at DESC"
    )->fetchAll();
    json_out(['users' => array_map('user_public', $rows)]);
  }

  if ($view === 'agents') {
    $rows = pdo()->query(
      "SELECT * FROM users WHERE role = 'agent' ORDER BY created_at DESC"
    )->fetchAll();
    json_out(['users' => array_map('user_public', $rows)]);
  }

  if ($view === 'bookings') {
    $rows = pdo()->query(
      'SELECT b.*, p.name_th AS product_name, p.name_en AS product_name_en, u.name AS user_name
       FROM bookings b JOIN products p ON p.id = b.product_id JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC, b.id DESC LIMIT 200'
    )->fetchAll();
    json_out(['bookings' => array_map('booking_public', $rows)]);
  }

  json_err('view ไม่ถูกต้อง');
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'set_approval') {
  $userId = (int) ($body['user_id'] ?? 0);
  $approved = (bool) ($body['approved'] ?? false);
  $st = pdo()->prepare("UPDATE users SET approved = ? WHERE id = ? AND role = 'user'");
  $st->execute([$approved ? 1 : 0, $userId]);
  if ($st->rowCount() === 0 && !$approved) {
    // reject ผู้ใช้ที่ approved=0 อยู่แล้ว → ไม่มีแถวเปลี่ยน ถือว่าสำเร็จ
    $chk = pdo()->prepare("SELECT id FROM users WHERE id = ? AND role = 'user'");
    $chk->execute([$userId]);
    if (!$chk->fetch()) json_err('ไม่พบผู้ใช้', 404);
  }
  json_out([]);
}

if ($action === 'create_agent') {
  // สร้างบัญชีพนักงาน (agent) — เฉพาะแอดมิน · agent สมัครเองไม่ได้ · อนุมัติอัตโนมัติ
  $email = strtolower(trim((string) ($body['email'] ?? '')));
  $password = (string) ($body['password'] ?? '');
  $name = trim((string) ($body['name'] ?? ''));
  $phone = trim((string) ($body['phone'] ?? ''));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('รูปแบบอีเมลไม่ถูกต้อง');
  if (mb_strlen($password) < 6) json_err('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
  if ($name === '') json_err('กรุณากรอกชื่อ');

  $st = pdo()->prepare('SELECT id FROM users WHERE email = ?');
  $st->execute([$email]);
  if ($st->fetch()) json_err('อีเมลนี้ถูกใช้แล้ว', 409);

  pdo()->prepare(
    "INSERT INTO users (email, password_hash, name, phone, role, approved) VALUES (?, ?, ?, ?, 'agent', 1)"
  )->execute([$email, password_hash($password, PASSWORD_DEFAULT), $name, $phone]);
  json_out([], 201);
}

if ($action === 'delete_agent') {
  $userId = (int) ($body['user_id'] ?? 0);
  $st = pdo()->prepare("DELETE FROM users WHERE id = ? AND role = 'agent'");
  $st->execute([$userId]);
  if ($st->rowCount() === 0) json_err('ไม่พบพนักงาน', 404);
  json_out([]);
}

if ($action === 'confirm_booking') {
  $bookingId = (int) ($body['booking_id'] ?? 0);
  $st = pdo()->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
  $st->execute([$bookingId]);
  json_out([]);
}

if ($action === 'update_price') {
  $productId = (int) ($body['product_id'] ?? 0);
  $price = (float) ($body['price_per_kg'] ?? 0);
  $high = (float) ($body['high_of_day'] ?? 0);
  $low = (float) ($body['low_of_day'] ?? 0);
  if ($price <= 0) json_err('ราคาต้องมากกว่า 0');
  $st = pdo()->prepare(
    'UPDATE products SET prev_price_per_kg = price_per_kg, price_per_kg = ?, high_of_day = ?, low_of_day = ? WHERE id = ?'
  );
  $st->execute([$price, $high, $low, $productId]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
