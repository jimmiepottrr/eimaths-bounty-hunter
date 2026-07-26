-- Migration: เพิ่มตาราง audit_log (บันทึกการใช้งาน) — idempotent รันซ้ำได้
-- รันบน VPS:  mysql copper8000 < migrate_audit.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  actor_email VARCHAR(190) NULL,
  actor_role VARCHAR(20) NULL,
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(40) NULL,
  entity_id INT NULL,
  detail TEXT NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
