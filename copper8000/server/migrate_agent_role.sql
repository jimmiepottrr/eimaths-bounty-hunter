-- Migration: เพิ่ม role 'agent' (พนักงานขาย/นายหน้า) เข้า enum ของ users — รันซ้ำได้ (idempotent)
-- ใช้: mysql copper8000 < migrate_agent_role.sql

ALTER TABLE users
  MODIFY role ENUM('user','agent','admin') NOT NULL DEFAULT 'user';
