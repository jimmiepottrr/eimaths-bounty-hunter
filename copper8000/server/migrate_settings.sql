-- Migration: ตาราง settings (เก็บธีมสีของเว็บ) — รันซ้ำได้ (idempotent)

CREATE TABLE IF NOT EXISTS settings (
  skey VARCHAR(64) PRIMARY KEY,
  sval VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO settings (skey, sval) VALUES ('theme', 'gold');
