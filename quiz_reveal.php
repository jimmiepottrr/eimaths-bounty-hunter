<?php
/**
 * GET /quiz_reveal.php?session_id=NN
 * เฉลยของ session หนึ่ง — เฉพาะบัญชี "ผู้ตรวจ" เท่านั้น
 * gate 2 ชั้น: (1) player id ต้องตรง setting reviewer_player_id  (2) session ต้องเป็นของ player คนนั้นเอง
 * ผู้เล่นปกติ = 403 เสมอ (เฉลยไม่มีทางหลุด)
 * ── ลบไฟล์นี้ + ลบ setting reviewer_player_id = ความสามารถหายเกลี้ยง ──
 */
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
api_key_check();
$player = current_player();
// gate: อนุญาตหลายบัญชีผู้ตรวจได้ (reviewer_player_ids = อาเรย์) + รองรับค่าเดิม reviewer_player_id (เดี่ยว)
$ids = setting('reviewer_player_ids', []);
if (!is_array($ids)) $ids = [];
$ids = array_map('intval', $ids);
$single = (int) setting('reviewer_player_id', 0);
if ($single > 0) $ids[] = $single;
if (empty($ids) || !in_array((int) $player['id'], $ids, true)) {
  json_err('เฉพาะบัญชีผู้ตรวจเท่านั้น', 403);
}
$sid = (int) ($_GET['session_id'] ?? 0);
$db = pdo();
$st = $db->prepare('SELECT question_ids FROM bh_quiz_sessions WHERE id = ? AND player_id = ? LIMIT 1');
$st->execute([$sid, (int) $player['id']]);
$row = $st->fetch();
if (!$row) {
  json_err('ไม่พบ session', 404);
}
$qids = json_decode((string) $row['question_ids'], true);
$answers = [];
if (is_array($qids) && $qids) {
  $q = qmap();
  $ph = implode(',', array_fill(0, count($qids), '?'));
  $st = $db->prepare("SELECT `{$q['id']}` AS qid, `{$q['answer']}` AS ans FROM `{$q['table']}` WHERE `{$q['id']}` IN ($ph)");
  $st->execute(array_map('intval', $qids));
  foreach ($st->fetchAll() as $r) {
    $answers[(string) (int) $r['qid']] = (string) $r['ans'];
  }
}
json_out(['answers' => $answers]);
