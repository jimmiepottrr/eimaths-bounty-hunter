<?php
/**
 * admin.php — เฉพาะ role=admin
 * GET  ?view=pending_users | ?view=bookings
 * POST {action:'set_approval'|'confirm_booking'|'update_price', ...}
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();
$admin = require_admin();

/** ผู้ใช้ agent + สรุปค่าคอม (สำหรับหน้าแอดมิน) — commission = rate% × ยอด confirmed */
function agent_public(array $a): array {
  $rate = isset($a['commission_rate']) ? (float) $a['commission_rate'] : 0;
  $confirmed = isset($a['confirmed_total']) ? (float) $a['confirmed_total'] : 0;
  return user_public($a) + [
    'customer_count'  => (int) ($a['customer_count'] ?? 0),
    'confirmed_total' => $confirmed,
    'commission'      => round($rate / 100 * $confirmed, 2),
  ];
}

/** สร้าง referral code ไม่ซ้ำ (6 ตัว ตัดอักษรที่สับสน 0/O/1/I) */
function gen_referral_code(): string {
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for ($try = 0; $try < 20; $try++) {
    $code = '';
    for ($i = 0; $i < 6; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    $st = pdo()->prepare('SELECT id FROM users WHERE referral_code = ?');
    $st->execute([$code]);
    if (!$st->fetch()) return $code;
  }
  return 'AG' . random_int(1000, 9999);
}

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
    // agent + สรุปค่าคอม: จำนวนลูกค้าที่ผูก, ยอด confirmed, ค่าคอม = rate% × ยอด
    $rows = pdo()->query(
      "SELECT a.*,
         (SELECT COUNT(*) FROM users c WHERE c.agent_id = a.id) AS customer_count,
         COALESCE((SELECT SUM(b.total_estimate) FROM bookings b
                   JOIN users c ON c.id = b.user_id
                   WHERE c.agent_id = a.id AND b.status = 'confirmed'), 0) AS confirmed_total
       FROM users a WHERE a.role = 'agent' ORDER BY a.created_at DESC"
    )->fetchAll();
    json_out(['agents' => array_map('agent_public', $rows)]);
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

  if ($view === 'customers') {
    // ลูกค้าทั้งหมด + ข้อมูลเครดิต/เตือน/ระงับ (user_public มีฟิลด์เครดิตอยู่แล้ว)
    $rows = pdo()->query(
      "SELECT * FROM users WHERE role = 'user' ORDER BY created_at DESC"
    )->fetchAll();
    json_out(['customers' => array_map('user_public', $rows)]);
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
  audit_log($approved ? 'approve_user' : 'reject_user', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId, 'detail' => ['approved' => $approved]]);
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

  $rate = (float) ($body['commission_rate'] ?? 0);
  if ($rate < 0 || $rate > 100) json_err('เปอร์เซ็นต์ค่าคอมต้องอยู่ระหว่าง 0–100');

  $st = pdo()->prepare('SELECT id FROM users WHERE email = ?');
  $st->execute([$email]);
  if ($st->fetch()) json_err('อีเมลนี้ถูกใช้แล้ว', 409);

  $code = gen_referral_code();
  pdo()->prepare(
    "INSERT INTO users (email, password_hash, name, phone, role, approved, referral_code, commission_rate)
     VALUES (?, ?, ?, ?, 'agent', 1, ?, ?)"
  )->execute([$email, password_hash($password, PASSWORD_DEFAULT), $name, $phone, $code, $rate]);
  $newId = (int) pdo()->lastInsertId();
  audit_log('create_agent', ['user' => $admin, 'entity' => 'user', 'entity_id' => $newId, 'detail' => ['email' => $email, 'name' => $name, 'referral_code' => $code, 'commission_rate' => $rate]]);
  json_out(['referral_code' => $code], 201);
}

if ($action === 'set_commission_rate') {
  $userId = (int) ($body['user_id'] ?? 0);
  $rate = (float) ($body['commission_rate'] ?? 0);
  if ($rate < 0 || $rate > 100) json_err('เปอร์เซ็นต์ค่าคอมต้องอยู่ระหว่าง 0–100');
  $st = pdo()->prepare("UPDATE users SET commission_rate = ? WHERE id = ? AND role = 'agent'");
  $st->execute([$rate, $userId]);
  if ($st->rowCount() === 0) {
    $chk = pdo()->prepare("SELECT id FROM users WHERE id = ? AND role = 'agent'");
    $chk->execute([$userId]);
    if (!$chk->fetch()) json_err('ไม่พบพนักงาน', 404);
  }
  audit_log('set_commission_rate', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId, 'detail' => ['commission_rate' => $rate]]);
  json_out([]);
}

if ($action === 'delete_agent') {
  $userId = (int) ($body['user_id'] ?? 0);
  // ปลดลูกค้าที่ผูกกับ agent นี้ก่อน (ไม่ให้ค้าง agent_id ที่ไม่มีตัวตน)
  pdo()->prepare('UPDATE users SET agent_id = NULL WHERE agent_id = ?')->execute([$userId]);
  $st = pdo()->prepare("DELETE FROM users WHERE id = ? AND role = 'agent'");
  $st->execute([$userId]);
  if ($st->rowCount() === 0) json_err('ไม่พบพนักงาน', 404);
  audit_log('delete_agent', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId]);
  json_out([]);
}

if ($action === 'confirm_booking') {
  $bookingId = (int) ($body['booking_id'] ?? 0);
  pdo()->beginTransaction();
  try {
    // ยืนยันเฉพาะรายการที่ยัง pending (กันยืนยันซ้ำ/ยืนยันรายการที่ยกเลิกแล้ว)
    $bk = pdo()->prepare('SELECT id, user_id, status, deposit_held FROM bookings WHERE id = ? FOR UPDATE');
    $bk->execute([$bookingId]);
    $booking = $bk->fetch();
    if (!$booking) { pdo()->rollBack(); json_err('ไม่พบรายการจอง', 404); }
    if ($booking['status'] !== 'pending') { pdo()->rollBack(); json_err('รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว', 409); }
    pdo()->prepare("UPDATE bookings SET status = 'confirmed', deposit_held = 0 WHERE id = ?")->execute([$bookingId]);
    // คืนเครดิตมัดจำให้ลูกค้า (การซื้อขายสำเร็จ = แอดมินยืนยัน)
    $dep = (float) $booking['deposit_held'];
    if ($dep > 0) {
      pdo()->prepare('UPDATE users SET credit_balance = credit_balance + ?, credit_held = credit_held - ? WHERE id = ?')
        ->execute([$dep, $dep, (int) $booking['user_id']]);
    }
    pdo()->commit();
  } catch (Throwable $e) {
    if (pdo()->inTransaction()) pdo()->rollBack();
    throw $e;
  }
  audit_log('confirm_booking', ['user' => $admin, 'entity' => 'booking', 'entity_id' => $bookingId, 'detail' => ['deposit_returned' => (float) $booking['deposit_held']]]);
  json_out([]);
}

// ยกเลิกการจอง → คืนเครดิตที่กันไว้ (ถ้ายังไม่ยืนยัน) · ไม่เตือนอัตโนมัติ (แอดมินกดเตือนเองแยกต่างหาก)
if ($action === 'cancel_booking') {
  $bookingId = (int) ($body['booking_id'] ?? 0);
  pdo()->beginTransaction();
  try {
    $bk = pdo()->prepare('SELECT id, user_id, status, deposit_held FROM bookings WHERE id = ? FOR UPDATE');
    $bk->execute([$bookingId]);
    $booking = $bk->fetch();
    if (!$booking) { pdo()->rollBack(); json_err('ไม่พบรายการจอง', 404); }
    if ($booking['status'] === 'cancelled') { pdo()->rollBack(); json_err('รายการนี้ถูกยกเลิกไปแล้ว', 409); }
    $dep = (float) $booking['deposit_held'];
    // คืนเครดิตที่กันไว้ (ถ้ามี) แล้วเคลียร์ยอดกันของการจองนี้
    if ($dep > 0) {
      pdo()->prepare('UPDATE users SET credit_balance = credit_balance + ?, credit_held = credit_held - ? WHERE id = ?')
        ->execute([$dep, $dep, (int) $booking['user_id']]);
    }
    pdo()->prepare("UPDATE bookings SET status = 'cancelled', deposit_held = 0 WHERE id = ?")->execute([$bookingId]);
    pdo()->commit();
  } catch (Throwable $e) {
    if (pdo()->inTransaction()) pdo()->rollBack();
    throw $e;
  }
  audit_log('cancel_booking', ['user' => $admin, 'entity' => 'booking', 'entity_id' => $bookingId, 'detail' => ['deposit_returned' => (float) $booking['deposit_held']]]);
  json_out([]);
}

// แอดมินกดตักเตือนลูกค้าเอง → ใบเตือน +1 · ครบ 3 ครั้ง ระงับสิทธิ์จองอัตโนมัติ
if ($action === 'warn_user') {
  $userId = (int) ($body['user_id'] ?? 0);
  $suspendedNow = false;
  $warnCount = 0;
  pdo()->beginTransaction();
  try {
    $u = pdo()->prepare("SELECT warnings FROM users WHERE id = ? AND role = 'user' FOR UPDATE");
    $u->execute([$userId]);
    $row = $u->fetch();
    if (!$row) { pdo()->rollBack(); json_err('ไม่พบลูกค้า', 404); }
    $warnCount = (int) $row['warnings'] + 1;
    pdo()->prepare('UPDATE users SET warnings = warnings + 1 WHERE id = ?')->execute([$userId]);
    if ($warnCount >= 3) {
      pdo()->prepare('UPDATE users SET booking_suspended = 1 WHERE id = ?')->execute([$userId]);
      $suspendedNow = true;
    }
    pdo()->commit();
  } catch (Throwable $e) {
    if (pdo()->inTransaction()) pdo()->rollBack();
    throw $e;
  }
  audit_log('warn_user', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId, 'detail' => ['warnings' => $warnCount, 'suspended' => $suspendedNow]]);
  json_out(['warnings' => $warnCount, 'suspended' => $suspendedNow]);
}

// แอดมินเติม/ปรับเครดิตให้ลูกค้า (amount บวก=เติม, ลบ=หัก — ห้ามให้ยอดใช้ได้ติดลบ)
if ($action === 'grant_credit') {
  $userId = (int) ($body['user_id'] ?? 0);
  $amount = (float) ($body['amount'] ?? 0);
  if ($amount === 0.0) json_err('กรุณาระบุจำนวนเครดิต');
  if (abs($amount) > 1000000000) json_err('จำนวนเครดิตมากเกินไป');
  $upd = pdo()->prepare(
    "UPDATE users SET credit_balance = credit_balance + ? WHERE id = ? AND role = 'user' AND credit_balance + ? >= 0"
  );
  $upd->execute([$amount, $userId, $amount]);
  if ($upd->rowCount() === 0) {
    $chk = pdo()->prepare("SELECT credit_balance FROM users WHERE id = ? AND role = 'user'");
    $chk->execute([$userId]);
    $row = $chk->fetch();
    if (!$row) json_err('ไม่พบลูกค้า', 404);
    json_err('เครดิตคงเหลือไม่พอสำหรับหักออก (คงเหลือ ' . (float) $row['credit_balance'] . ')', 400);
  }
  audit_log('grant_credit', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId, 'detail' => ['amount' => $amount]]);
  json_out([]);
}

// แอดมินตั้งยอดมัดจำต่อการจอง (0 = ปิดระบบมัดจำ)
if ($action === 'set_booking_deposit') {
  $amount = (float) ($body['amount'] ?? 0);
  if ($amount < 0) json_err('ยอดมัดจำต้องไม่ติดลบ');
  if ($amount > 1000000000) json_err('ยอดมัดจำมากเกินไป');
  set_setting('booking_deposit', (string) $amount);
  audit_log('set_booking_deposit', ['user' => $admin, 'entity' => 'settings', 'detail' => ['booking_deposit' => $amount]]);
  json_out([]);
}

// แอดมินตั้งเครดิตเริ่มต้นให้ลูกค้าที่สมัครใหม่ (0 = ไม่ให้)
if ($action === 'set_default_credit') {
  $amount = (float) ($body['amount'] ?? 0);
  if ($amount < 0) json_err('เครดิตเริ่มต้นต้องไม่ติดลบ');
  if ($amount > 1000000000) json_err('เครดิตเริ่มต้นมากเกินไป');
  set_setting('default_credit', (string) $amount);
  audit_log('set_default_credit', ['user' => $admin, 'entity' => 'settings', 'detail' => ['default_credit' => $amount]]);
  json_out([]);
}

// แอดมินรีเซ็ตใบเตือน + ปลดระงับสิทธิ์จอง
if ($action === 'reset_warnings') {
  $userId = (int) ($body['user_id'] ?? 0);
  $st = pdo()->prepare("UPDATE users SET warnings = 0, booking_suspended = 0 WHERE id = ? AND role = 'user'");
  $st->execute([$userId]);
  if ($st->rowCount() === 0) {
    $chk = pdo()->prepare("SELECT id FROM users WHERE id = ? AND role = 'user'");
    $chk->execute([$userId]);
    if (!$chk->fetch()) json_err('ไม่พบลูกค้า', 404);
  }
  audit_log('reset_warnings', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId]);
  json_out([]);
}

// แอดมินระงับ/ปลดระงับสิทธิ์จองด้วยตนเอง
if ($action === 'set_booking_suspended') {
  $userId = (int) ($body['user_id'] ?? 0);
  $suspended = (bool) ($body['suspended'] ?? false);
  $st = pdo()->prepare("UPDATE users SET booking_suspended = ? WHERE id = ? AND role = 'user'");
  $st->execute([$suspended ? 1 : 0, $userId]);
  if ($st->rowCount() === 0) {
    $chk = pdo()->prepare("SELECT id FROM users WHERE id = ? AND role = 'user'");
    $chk->execute([$userId]);
    if (!$chk->fetch()) json_err('ไม่พบลูกค้า', 404);
  }
  audit_log($suspended ? 'suspend_user' : 'unsuspend_user', ['user' => $admin, 'entity' => 'user', 'entity_id' => $userId]);
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
  audit_log('set_weights', ['user' => $admin, 'entity' => 'booking', 'entity_id' => $bookingId, 'detail' => ['actual_weight_kg' => $actual, 'qc_weight_kg' => $qc]]);
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
  $newId = (int) pdo()->lastInsertId();
  audit_log('add_product', ['user' => $admin, 'entity' => 'product', 'entity_id' => $newId, 'detail' => ['material' => $material, 'name_th' => $nameTh, 'price_per_kg' => $price]]);
  json_out(['id' => $newId]);
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
  audit_log('update_product', ['user' => $admin, 'entity' => 'product', 'entity_id' => $productId, 'detail' => ['material' => $material, 'name_th' => $nameTh, 'name_en' => $nameEn]]);
  json_out([]);
}

if ($action === 'set_product_active') {
  $productId = (int) ($body['product_id'] ?? 0);
  $active = (bool) ($body['active'] ?? false);
  pdo()->prepare('UPDATE products SET active = ? WHERE id = ?')->execute([$active ? 1 : 0, $productId]);
  audit_log($active ? 'show_product' : 'hide_product', ['user' => $admin, 'entity' => 'product', 'entity_id' => $productId, 'detail' => ['active' => $active]]);
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
  audit_log('delete_product', ['user' => $admin, 'entity' => 'product', 'entity_id' => $productId]);
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
  audit_log('reorder_products', ['user' => $admin, 'entity' => 'product', 'detail' => ['order' => array_map('intval', $order)]]);
  json_out([]);
}

if ($action === 'update_price') {
  $productId = (int) ($body['product_id'] ?? 0);
  $price = (float) ($body['price_per_kg'] ?? 0);
  $high = (float) ($body['high_of_day'] ?? 0);
  $low = (float) ($body['low_of_day'] ?? 0);
  if ($price <= 0) json_err('ราคาต้องมากกว่า 0');
  // อ่านราคาเดิมก่อนแก้ เพื่อบันทึกเก่า→ใหม่ ใน audit log
  $prevSt = pdo()->prepare('SELECT price_per_kg FROM products WHERE id = ?');
  $prevSt->execute([$productId]);
  $oldPrice = $prevSt->fetchColumn();
  $st = pdo()->prepare(
    'UPDATE products SET prev_price_per_kg = price_per_kg, price_per_kg = ?, high_of_day = ?, low_of_day = ? WHERE id = ?'
  );
  $st->execute([$price, $high, $low, $productId]);
  audit_log('update_price', ['user' => $admin, 'entity' => 'product', 'entity_id' => $productId, 'detail' => ['old_price' => $oldPrice !== false ? (float) $oldPrice : null, 'new_price' => $price, 'high_of_day' => $high, 'low_of_day' => $low]]);
  json_out([]);
}

json_err('action ไม่ถูกต้อง');
