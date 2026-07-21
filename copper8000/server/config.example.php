<?php
/**
 * Copper 8000 API — Config
 * วิธีใช้: คัดลอกไฟล์นี้เป็น config.php บนเซิร์ฟเวอร์แล้วกรอกค่าจริง
 * config.php ห้าม commit ขึ้น git เด็ดขาด (nginx ก็ deny ไว้แล้ว)
 */
declare(strict_types=1);

// ---------- ฐานข้อมูล ----------
const DB_HOST = 'localhost';
const DB_NAME = 'copper8000';
const DB_USER = 'YOUR_DB_USER';
const DB_PASS = 'YOUR_DB_PASSWORD';

// ---------- ความปลอดภัย ----------
// เว็บต้องส่ง header X-Api-Key ให้ตรงค่านี้ (ตั้งยาวๆ สุ่มๆ 40+ ตัวอักษร)
const API_KEY = 'CHANGE_ME_LONG_RANDOM_STRING';
// โดเมนของเว็บ (CORS)
const ALLOWED_ORIGIN = 'https://jimmiepottrr.github.io';
// อายุโทเคนล็อกอิน (วัน)
const TOKEN_TTL_DAYS = 30;
