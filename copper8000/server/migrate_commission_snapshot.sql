-- Migration: ค่าคอมรายเดือนแบบล็อกตัวเลข
--   1) bookings เก็บค่าคอม ณ ตอนยืนยัน (agent / % / จำนวนเงิน / เวลาไทย) → ปรับ % หรือปิดพนักงานทีหลัง ตัวเลขเก่าไม่เปลี่ยน
--   2) users(agent) มี % ใหม่ที่รอมีผลวันที่ 1 เดือนถัดไป + ปิดใช้งาน (soft delete) แทนการลบจริง
-- ใช้: mysql copper8000 < migrate_commission_snapshot.sql   (idempotent — รันซ้ำได้บน MariaDB 10.5+)
-- หมายเหตุเวลา: DB/PHP เป็น UTC · confirmed_at เก็บเป็นเวลาไทย (UTC+7) เพื่อตัดรอบเดือนตามเวลาไทย

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS commission_agent_id INT NULL,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(14,2) NULL,
  ADD INDEX IF NOT EXISTS idx_commission (commission_agent_id, confirmed_at);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pending_commission_rate DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS pending_rate_from DATE NULL,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

-- เวลายืนยันของรายการเก่า: ใช้เวลาจาก audit log (confirm_booking) ถ้ามี ไม่งั้นใช้เวลาจอง · แปลง UTC → เวลาไทย
UPDATE bookings b
SET b.confirmed_at = DATE_ADD(COALESCE(
      (SELECT MAX(a.created_at) FROM audit_log a
        WHERE a.action = 'confirm_booking' AND a.entity = 'booking' AND a.entity_id = b.id),
      b.created_at), INTERVAL 7 HOUR)
WHERE b.status = 'confirmed' AND b.confirmed_at IS NULL;

-- ล็อกค่าคอมของรายการที่ยืนยันไว้ก่อนมีระบบนี้ (ครั้งเดียว) ด้วย % ปัจจุบันของ agent ตอนย้ายระบบ
UPDATE bookings b
JOIN users c ON c.id = b.user_id
JOIN users a ON a.id = c.agent_id AND a.role = 'agent'
SET b.commission_agent_id = a.id,
    b.commission_rate = a.commission_rate,
    b.commission_amount = ROUND(a.commission_rate / 100 * b.total_estimate, 2)
WHERE b.status = 'confirmed' AND b.commission_agent_id IS NULL;
