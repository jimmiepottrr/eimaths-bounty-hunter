-- Migration: ระบบค่าคอมมิชชั่น — เพิ่มคอลัมน์ agent_id / referral_code / commission_rate ใน users
-- ใช้: mysql copper8000 < migrate_agent_commission.sql   (idempotent — รันซ้ำได้บน MariaDB/MySQL 8.0.29+)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agent_id INT NULL,
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0;

-- ทำให้ referral_code ไม่ซ้ำ (ข้ามถ้ามี index อยู่แล้ว)
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS uniq_referral_code (referral_code);
