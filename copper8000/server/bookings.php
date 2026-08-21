<?php
/**
 * bookings.php — POST สร้างการจอง (ต้อง approved) · GET รายการของฉัน 10 รายการล่าสุด
 * ราคาคำนวณฝั่งเซิร์ฟเวอร์เสมอ (snapshot ราคา ณ เวลาจอง)
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();
$user = require_auth();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $st = pdo()->prepare(
    'SELECT b.*, p.name_th AS product_name, p.name_en AS product_name_en, u.name AS user_name
     FROM bookings b JOIN products p ON p.id = b.product_id JOIN users u ON u.id = b.user_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC, b.id DESC LIMIT 10'
  );
  $st->execute([(int) $user['id']]);
  json_out(['bookings' => array_map('booking_public', $st->fetchAll())]);
}

if ($method !== 'POST') json_err('method ไม่ถูกต้อง', 405);

if (!(bool) $user['approved']) json_err('บัญชียังไม่ได้รับการอนุมัติ จึงยังจองไม่ได้', 403);
if ((bool) ($user['booking_suspended'] ?? false)) json_err('บัญชีถูกระงับสิทธิ์การจองชั่วคราว กรุณาติดต่อบริษัท', 403);

$body = read_json_body();
$productId = (int) ($body['product_id'] ?? 0);
$quantity = (float) ($body['quantity'] ?? 0);
$unit = (string) ($body['unit'] ?? 'ton');
$deliveryDate = trim((string) ($body['delivery_date'] ?? ''));

if (!in_array($unit, ['kg', 'ton'], true)) json_err('หน่วยไม่ถูกต้อง');
if ($quantity <= 0) json_err('จำนวนต้องมากกว่า 0');
if ($quantity > 1000000) json_err('จำนวนมากเกินไป');

// วันที่ส่งสินค้า (ไม่บังคับ) — ต้องเป็น YYYY-MM-DD และไม่ย้อนหลัง
if ($deliveryDate !== '') {
  $d = DateTime::createFromFormat('Y-m-d', $deliveryDate);
  if (!$d || $d->format('Y-m-d') !== $deliveryDate) json_err('วันที่ส่งสินค้าไม่ถูกต้อง');
  if ($deliveryDate < date('Y-m-d')) json_err('วันที่ส่งสินค้าต้องไม่เป็นอดีต');
} else {
  $deliveryDate = null;
}

$st = pdo()->prepare('SELECT * FROM products WHERE id = ?');
$st->execute([$productId]);
$product = $st->fetch();
if (!$product) json_err('ไม่พบสินค้า', 404);

$kg = $unit === 'ton' ? $quantity * 1000 : $quantity;
if ($kg < 100) json_err('ต้องจองอย่างน้อย 100 กิโลกรัม');
$price = (float) $product['price_per_kg'];

// กันจองติดราคาที่เปลี่ยนไประหว่างเปิดหน้าจอ: client ส่งราคาที่เห็นมาเทียบ ไม่ตรง = 409
$expected = $body['expected_price_per_kg'] ?? null;
if ($expected !== null && abs(((float) $expected) - $price) > 0.001) {
  json_err('ราคามีการเปลี่ยนแปลง กรุณาตรวจสอบราคาใหม่', 409);
}

$total = round($kg * $price, 2);

// ---- เครดิต: จองแล้วหักเครดิตเท่ายอดจองจริง (คืนเมื่อแอดมินยืนยัน/ยกเลิก) ----
// transaction: หักเครดิตแบบมีเงื่อนไข (credit_balance ต้องพอ) แล้วค่อยสร้างการจอง
$hold = $total;
$uid = (int) $user['id'];
pdo()->beginTransaction();
try {
  // หักจากยอดที่ใช้ได้ → ย้ายไปเป็นยอดกันไว้ (เงื่อนไข credit_balance >= hold กัน race/ติดลบ)
  $st = pdo()->prepare(
    'UPDATE users SET credit_balance = credit_balance - ?, credit_held = credit_held + ?
     WHERE id = ? AND credit_balance >= ?'
  );
  $st->execute([$hold, $hold, $uid, $hold]);
  if ($st->rowCount() === 0) {
    pdo()->rollBack();
    $have = (float) ($user['credit_balance'] ?? 0);
    json_err('เครดิตไม่พอ ต้องใช้ ' . number_format($total, 0) . ' บาท (คุณมี ' . number_format($have, 0) . ' บาท) — กรุณาติดต่อบริษัทเพื่อเติมเครดิต', 402);
  }
  pdo()->prepare(
    "INSERT INTO bookings (user_id, product_id, quantity, unit, price_at_booking, total_estimate, status, deposit_held, delivery_date)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
  )->execute([$uid, $productId, $quantity, $unit, $price, $total, $hold, $deliveryDate]);
  $bookingId = (int) pdo()->lastInsertId();
  pdo()->commit();
} catch (Throwable $e) {
  if (pdo()->inTransaction()) pdo()->rollBack();
  throw $e;
}

audit_log('create_booking', ['user' => $user, 'entity' => 'booking', 'entity_id' => $bookingId, 'detail' => [
  'product_id' => $productId, 'product' => $product['name_th'], 'quantity' => $quantity, 'unit' => $unit,
  'price_at_booking' => $price, 'total_estimate' => $total, 'deposit_held' => $hold,
]]);

$st = pdo()->prepare(
  'SELECT b.*, p.name_th AS product_name, p.name_en AS product_name_en, u.name AS user_name
   FROM bookings b JOIN products p ON p.id = b.product_id JOIN users u ON u.id = b.user_id
   WHERE b.id = ?'
);
$st->execute([$bookingId]);
json_out(['booking' => booking_public($st->fetch())], 201);
