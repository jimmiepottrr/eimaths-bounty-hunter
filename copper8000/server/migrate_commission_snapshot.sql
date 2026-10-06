-- Migration: ค่าคอมแบบล็อกตัวเลข + ไม่มีการลบ
--   1) % ค่าคอมล็อกไว้กับการจอง "ตั้งแต่ตอนจอง" (agent / % / จำนวนเงิน) → ปรับ % ทีหลังไม่กระทบรายการเดิม
--      ค่าคอมนับเมื่อแอดมินยืนยัน (confirmed_at = เวลาไทย ใช้ตัดรอบเดือน) · ยกเลิก = ไม่นับ แต่ยังแสดง
--   2) พนักงานไม่มีการลบ — ปิด/เปิดใช้งาน (disabled_at)
-- ใช้: mysql copper8000 < migrate_commission_snapshot.sql   (idempotent — รันซ้ำได้บน MariaDB 10.5+)
-- ลำดับ deploy: รันไฟล์นี้ก่อน → อัปโหลด PHP → ขึ้นหน้าเว็บ
-- หมายเหตุเวลา: DB/PHP เป็น UTC · confirmed_at เก็บเป็นเวลาไทย (UTC+7)

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS confirmed_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS commission_agent_id INT NULL,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(14,2) NULL,
  ADD COLUMN IF NOT EXISTS commission_locked TINYINT(1) NOT NULL DEFAULT 0,
  ADD INDEX IF NOT EXISTS idx_commission (commission_agent_id, confirmed_at);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS disabled_at DATETIME NULL;

-- เวลายืนยันของรายการเก่า: จาก audit log (confirm_booking) ถ้ามี ไม่งั้นใช้เวลาจอง · แปลง UTC → เวลาไทย
UPDATE bookings b
SET b.confirmed_at = DATE_ADD(COALESCE(
      (SELECT MAX(a.created_at) FROM audit_log a
        WHERE a.action = 'confirm_booking' AND a.entity = 'booking' AND a.entity_id = b.id),
      b.created_at), INTERVAL 7 HOUR)
WHERE b.status = 'confirmed' AND b.confirmed_at IS NULL;

-- ล็อก % ให้การจองที่มีอยู่ก่อนระบบนี้ (ครั้งเดียว) ด้วย % ปัจจุบันของ agent ตอนย้ายระบบ
UPDATE bookings b
JOIN users c ON c.id = b.user_id
JOIN users a ON a.id = c.agent_id AND a.role = 'agent' AND a.disabled_at IS NULL
SET b.commission_agent_id = a.id,
    b.commission_rate = a.commission_rate,
    b.commission_amount = ROUND(a.commission_rate / 100 * b.total_estimate, 2)
WHERE b.commission_locked = 0 AND b.status IN ('pending', 'confirmed');

-- ทุกแถวถือว่าล็อกแล้ว — รันซ้ำจะไม่แตะรายการเดิมอีก (การจองใหม่ PHP ล็อกเองตอนสร้าง)
UPDATE bookings SET commission_locked = 1 WHERE commission_locked = 0;
