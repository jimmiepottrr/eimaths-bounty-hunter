<?php
/**
 * agent.php — เฉพาะ role=agent (พนักงานขาย) ดูข้อมูลของตัวเอง
 * GET ?view=commission (ค่าเริ่มต้น) → {referral_code, commission_rate, customer_count, confirmed_total, commission, months[]}
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

// ---- สรุปค่าคอมของตัวเอง — % ล็อกตอนจอง · นับเฉพาะการจองที่ยืนยันแล้ว (ยกเลิก = ไม่นับ) ----
$me = pdo()->prepare('SELECT * FROM users WHERE id = ?');
$me->execute([$agentId]);
$user = $me->fetch() ?: $user;

$cc = pdo()->prepare("SELECT COUNT(*) FROM users WHERE agent_id = ? AND role = 'user'");
$cc->execute([$agentId]);
$customerCount = (int) $cc->fetchColumn();

// รายเดือน (เวลาไทย) · เดือนก่อนเดือนปัจจุบัน = ปิดยอดแล้ว ตัวเลขล็อก
$ms = pdo()->prepare(
  "SELECT DATE_FORMAT(confirmed_at, '%Y-%m') AS m, COUNT(*) AS n,
     SUM(total_estimate) AS sales, SUM(commission_amount) AS comm,
     GROUP_CONCAT(DISTINCT commission_rate ORDER BY commission_rate) AS rates
   FROM bookings WHERE commission_agent_id = ? AND status = 'confirmed'
   GROUP BY m ORDER BY m DESC"
);
$ms->execute([$agentId]);
$cur = bkk_current_month();
$months = [];
$confirmedTotal = 0.0;
$commissionTotal = 0.0;
foreach ($ms->fetchAll() as $r) {
  $months[] = [
    'month'      => $r['m'],
    'bookings'   => (int) $r['n'],
    'sales'      => round((float) $r['sales'], 2),
    'commission' => round((float) $r['comm'], 2),
    'rates'      => rates_list($r['rates']),
    'locked'     => $r['m'] < $cur,
  ];
  $confirmedTotal += (float) $r['sales'];
  $commissionTotal += (float) $r['comm'];
}

json_out(['commission' => [
  'referral_code'           => $user['referral_code'] ?? null,
  'commission_rate'         => (float) ($user['commission_rate'] ?? 0),
  'customer_count'          => $customerCount,
  'confirmed_total'         => round($confirmedTotal, 2),
  'commission'              => round($commissionTotal, 2),
  'months'                  => $months,
]]);
