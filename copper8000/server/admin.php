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

  if ($view === 'products') {
    $rows = pdo()->query(
      "SELECT * FROM products ORDER BY FIELD(material,'copper','brass','aluminium'), sort_order, id"
    )->fetchAll();
    json_out(['products' => array_map('product_public', $rows)]);
  }

  if ($view === 'bookings') {
    $rows = pdo()->query(
      'SELECT b.*, p.name_th AS product_name, p.name_en AS product_name_en, u.name AS user_name
       FROM bookings b JOIN products p ON p.id = b.product_id JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC, b.id DESC LIMIT 1000'
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

if ($action === 'confirm_booking') {
  $bookingId = (int) ($body['booking_id'] ?? 0);
  $st = pdo()->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?");
  $st->execute([$bookingId]);
  json_out([]);
}

// แอดมินบันทึกน้ำหนักส่งจริง + น้ำหนักสุทธิหลัง QC (ค่าว่าง = ล้างค่า)
if ($action === 'set_weights') {
  $bookingId = (int) ($body['booking_id'] ?? 0);
  $parseW = static function ($v) {
    if ($v === null || $v === '') return null;
    $f = (float) $v;
    if ($f < 0) json_err('น้ำหนักต้องไม่ติดลบ');
    if ($f > 100000000) json_err('น้ำหนักมากเกินไป');
    return $f;
  };
  $actual = $parseW($body['actual_weight_kg'] ?? null);
  $qc = $parseW($body['qc_weight_kg'] ?? null);
  $st = pdo()->prepare('UPDATE bookings SET actual_weight_kg = ?, qc_weight_kg = ? WHERE id = ?');
  $st->execute([$actual, $qc, $bookingId]);
  if ($st->rowCount() === 0) {
    $chk = pdo()->prepare('SELECT id FROM bookings WHERE id = ?');
    $chk->execute([$bookingId]);
    if (!$chk->fetch()) json_err('ไม่พบรายการจอง', 404);
  }
  json_out([]);
}

// ---- จัดการสินค้า (Admin 1) ----
$materials = ['copper', 'brass', 'aluminium'];

if ($action === 'add_product') {
  $material = (string) ($body['material'] ?? '');
  $nameTh = trim((string) ($body['name_th'] ?? ''));
  $nameEn = trim((string) ($body['name_en'] ?? ''));
  $price = (float) ($body['price_per_kg'] ?? 0);
  if (!in_array($material, $materials, true)) json_err('ประเภทวัสดุไม่ถูกต้อง');
  if ($nameTh === '') json_err('กรุณากรอกชื่อสินค้า');
  if ($price <= 0) json_err('ราคาต้องมากกว่า 0');
  $maxSort = (int) pdo()->query('SELECT COALESCE(MAX(sort_order),0) FROM products')->fetchColumn();
  pdo()->prepare(
    'INSERT INTO products (material, name_th, name_en, price_per_kg, prev_price_per_kg, high_of_day, low_of_day, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
  )->execute([$material, $nameTh, $nameEn, $price, $price, $price, $price, $maxSort + 1]);
  json_out(['id' => (int) pdo()->lastInsertId()]);
}

if ($action === 'update_product') {
  $productId = (int) ($body['product_id'] ?? 0);
  $material = (string) ($body['material'] ?? '');
  $nameTh = trim((string) ($body['name_th'] ?? ''));
  $nameEn = trim((string) ($body['name_en'] ?? ''));
  if (!in_array($material, $materials, true)) json_err('ประเภทวัสดุไม่ถูกต้อง');
  if ($nameTh === '') json_err('กรุณากรอกชื่อสินค้า');
  $st = pdo()->prepare('UPDATE products SET material = ?, name_th = ?, name_en = ? WHERE id = ?');
  $st->execute([$material, $nameTh, $nameEn, $productId]);
  if ($st->rowCount() === 0) {
    $chk = pdo()->prepare('SELECT id FROM products WHERE id = ?');
    $chk->execute([$productId]);
    if (!$chk->fetch()) json_err('ไม่พบสินค้า', 404);
  }
  json_out([]);
}

if ($action === 'set_product_active') {
  $productId = (int) ($body['product_id'] ?? 0);
  $active = (bool) ($body['active'] ?? false);
  pdo()->prepare('UPDATE products SET active = ? WHERE id = ?')->execute([$active ? 1 : 0, $productId]);
  json_out([]);
}

if ($action === 'delete_product') {
  $productId = (int) ($body['product_id'] ?? 0);
  $chk = pdo()->prepare('SELECT COUNT(*) FROM bookings WHERE product_id = ?');
  $chk->execute([$productId]);
  if ((int) $chk->fetchColumn() > 0) {
    // มีประวัติการจอง — ลบจริงไม่ได้ (กันข้อมูลรายงานพัง) ให้ซ่อนแทน
    json_err('สินค้านี้มีประวัติการจองแล้ว ลบถาวรไม่ได้ — ใช้ "ซ่อน" แทน', 409);
  }
  pdo()->prepare('DELETE FROM products WHERE id = ?')->execute([$productId]);
  json_out([]);
}

if ($action === 'reorder_products') {
  $order = $body['order'] ?? [];
  if (!is_array($order)) json_err('ลำดับไม่ถูกต้อง');
  $st = pdo()->prepare('UPDATE products SET sort_order = ? WHERE id = ?');
  $i = 1;
  foreach ($order as $pid) {
    $st->execute([$i, (int) $pid]);
    $i++;
  }
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
