<?php
/**
 * audit.php — บันทึกการใช้งาน (เฉพาะ role=admin)
 * GET ?action=&user_id=&q=&from=YYYY-MM-DD&to=YYYY-MM-DD&page=&per_page=
 *   → {entries:[...], total, page, per_page, actions:[...]}
 * per_page สูงสุด 10000 (ใช้ตอน export CSV ฝั่ง client)
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();
require_admin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') json_err('method ไม่ถูกต้อง', 405);

function audit_public(array $r): array {
  return [
    'id'          => (int) $r['id'],
    'created_at'  => str_replace(' ', 'T', $r['created_at']),
    'user_id'     => $r['user_id'] !== null ? (int) $r['user_id'] : null,
    'actor_email' => $r['actor_email'],
    'actor_role'  => $r['actor_role'],
    'action'      => $r['action'],
    'entity'      => $r['entity'],
    'entity_id'   => $r['entity_id'] !== null ? (int) $r['entity_id'] : null,
    'detail'      => $r['detail'],
    'ip'          => $r['ip'],
    'user_agent'  => $r['user_agent'],
  ];
}

// ---------- สร้างเงื่อนไขกรอง (bind params ป้องกัน SQL injection) ----------
$where = [];
$params = [];

$fAction = trim((string) ($_GET['action'] ?? ''));
if ($fAction !== '') { $where[] = 'action = ?'; $params[] = $fAction; }

$fUser = (string) ($_GET['user_id'] ?? '');
if ($fUser !== '' && ctype_digit($fUser)) { $where[] = 'user_id = ?'; $params[] = (int) $fUser; }

$q = trim((string) ($_GET['q'] ?? ''));
if ($q !== '') {
  $where[] = '(actor_email LIKE ? OR ip LIKE ? OR detail LIKE ? OR user_agent LIKE ?)';
  $like = '%' . $q . '%';
  array_push($params, $like, $like, $like, $like);
}

$from = trim((string) ($_GET['from'] ?? ''));
if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) { $where[] = 'created_at >= ?'; $params[] = $from . ' 00:00:00'; }

$to = trim((string) ($_GET['to'] ?? ''));
if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) { $where[] = 'created_at <= ?'; $params[] = $to . ' 23:59:59'; }

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

// ---------- แบ่งหน้า (คลัมป์ค่าให้ปลอดภัย แล้ว inline เป็น int) ----------
$perPage = (int) ($_GET['per_page'] ?? 50);
if ($perPage < 1) $perPage = 50;
if ($perPage > 10000) $perPage = 10000;
$page = (int) ($_GET['page'] ?? 1);
if ($page < 1) $page = 1;
$offset = ($page - 1) * $perPage;

$cnt = pdo()->prepare("SELECT COUNT(*) FROM audit_log $whereSql");
$cnt->execute($params);
$total = (int) $cnt->fetchColumn();

$st = pdo()->prepare(
  "SELECT * FROM audit_log $whereSql ORDER BY id DESC LIMIT $perPage OFFSET $offset"
);
$st->execute($params);
$entries = array_map('audit_public', $st->fetchAll());

// รายชื่อ action ที่เคยเกิด (ไว้ทำ dropdown ตัวกรอง)
$actions = pdo()->query('SELECT DISTINCT action FROM audit_log ORDER BY action')->fetchAll(PDO::FETCH_COLUMN);

json_out([
  'entries'  => $entries,
  'total'    => $total,
  'page'     => $page,
  'per_page' => $perPage,
  'actions'  => $actions,
]);
