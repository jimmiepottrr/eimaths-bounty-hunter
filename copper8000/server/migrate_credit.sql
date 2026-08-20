-- Migration: ระบบเครดิต/มัดจำ/ตักเตือน
-- ใช้: mysql copper8000 < migrate_credit.sql   (idempotent — รันซ้ำได้บน MariaDB/MySQL 8.0.29+)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_held DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warnings INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_suspended TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deposit_held DECIMAL(12,2) NOT NULL DEFAULT 0;

-- เพิ่มสถานะ 'cancelled' ให้การจอง
ALTER TABLE bookings MODIFY status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending';

-- ยอดมัดจำเริ่มต้น 0 = ปิดระบบมัดจำ (ไม่กระทบลูกค้าเดิม จนกว่าแอดมินจะตั้งค่า)
INSERT IGNORE INTO settings (skey, sval) VALUES ('booking_deposit', '0');
