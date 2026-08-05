<?php
/**
 * agent.php — เฉพาะ role=agent (พนักงานขาย) ดูข้อมูลของตัวเอง
 * GET ?view=commission (ค่าเริ่มต้น) → {referral_code, commission_rate, customer_count, confirmed_total, commission}
 * GET ?view=members → รายชื่อลูกค้าที่ผูกกับ agent + ยอด confirmed ของแต่ละคน
 * คำนวณค่าคอมฝั่งเซิร์ฟเวอร์เสมอ (กันปลอมแปลง) — agent เห็นเฉพาะข้อมูลของตัวเอง
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();
$user = require_auth();
if ($user['role'] !== 'agent') json_err('เฉพาะพนักงาน (agent) เท่านั้น', 403);

$agentId = (int) $user['id'];
$view = (string) ($_GET['view'] ?? 'commission');

if ($view === 'members') {
  $st = pdo()->prepare(
    "SELECT c.id, c.name, c.email, c.phone, c.approved, c.created_at,
       COALESCE((SELECT SUM(b.total_estimate) FROM bookings b
                 WHERE b.user_id = c.id AND b.status = 'confirmed'), 0) AS confirmed_total
     FROM users c WHERE c.agent_id = ? AND c.role = 'user'
     ORDER BY c.created_at DESC"
  );
  $st->execute([$agentId]);
  $members = array_map(static function (array $r): array {
    return [
      'id'              => (int) $r['id'],
      'name'            => $r['name'],
      'email'           => $r['email'],
      'phone'           => $r['phone'],
      'approved'        => (bool) $r['approved'],
      'confirmed_total' => (float) $r['confirmed_total'],
    ];
  }, $st->fetchAll());
  json_out(['members' => $members]);
}

// ---- สรุปค่าคอมของตัวเอง ----
$rate = (float) ($user['commission_rate'] ?? 0);

$cc = pdo()->prepare("SELECT COUNT(*) FROM users WHERE agent_id = ? AND role = 'user'");
$cc->execute([$agentId]);
$customerCount = (int) $cc->fetchColumn();

$ct = pdo()->prepare(
  "SELECT COALESCE(SUM(b.total_estimate), 0) FROM bookings b
   JOIN users c ON c.id = b.user_id
   WHERE c.agent_id = ? AND b.status = 'confirmed'"
);
$ct->execute([$agentId]);
$confirmedTotal = (float) $ct->fetchColumn();

json_out(['commission' => [
  'referral_code'   => $user['referral_code'] ?? null,
  'commission_rate' => $rate,
  'customer_count'  => $customerCount,
  'confirmed_total' => $confirmedTotal,
  'commission'      => round($rate / 100 * $confirmedTotal, 2),
]]);
