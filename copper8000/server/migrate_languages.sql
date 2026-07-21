-- Migration: ตาราง languages (ระบบหลายภาษา) — รันซ้ำได้ (idempotent)

CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(16) PRIMARY KEY,
  name_native VARCHAR(100) NOT NULL,
  dict LONGTEXT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  built_in TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO languages (code, name_native, dict, enabled, built_in, sort_order) VALUES
('th', 'ไทย',        NULL, 1, 1, 1),
('en', 'English',    NULL, 1, 1, 2),
('zh', '中文(简体)',  NULL, 1, 1, 3);
