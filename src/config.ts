/**
 * Central game configuration — the ONLY place API credentials live.
 * ห้าม hardcode ค่าเหล่านี้ที่ไฟล์อื่นเด็ดขาด (ตาม COWORK-BRIEF ข้อ 2)
 *
 * ตอน deploy จริง: Jim แก้ 2 ค่านี้ (หรือ set VITE_API_BASE / VITE_API_KEY ตอน build)
 * หมายเหตุ: API key ของเกม public เป็น "app key" ที่คนเห็นได้ — ความปลอดภัยจริงอยู่ฝั่งเซิร์ฟเวอร์
 */

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'REPLACE_WITH_API_BASE'; // เช่น https://api.example.com/api

export const API_KEY: string =
  (import.meta.env.VITE_API_KEY as string | undefined) ?? 'REPLACE_WITH_API_KEY';

/**
 * ที่อยู่ของอาร์ตเวิร์ก (ฉาก/บอส) — serve จาก game server (VPS) โดยตรง
 * เหตุผล: ไฟล์ WebP รวมกันหลาย MB ถ้า commit เข้า repo จะทำให้ repo อ้วนและ build ช้า
 * VPS มี HTTPS + อยู่ที่เดียวกับ API อยู่แล้ว เกมพึ่ง VPS เป็นปกติ
 * override ได้ด้วย VITE_ASSET_BASE ตอน build (เช่นย้ายไป CDN ภายหลัง)
 */
export const ASSET_BASE: string =
  (import.meta.env.VITE_ASSET_BASE as string | undefined) ??
  'https://srv1813136.hstgr.cloud/assets/worlds';

/** URL เต็มของอาร์ตชิ้นหนึ่งจาก slug (เช่น 'scene-p3-1-beach') */
export const artUrl = (slug: string): string => `${ASSET_BASE}/${slug}.webp`;

/** จำนวนวินาที timeout ต่อ 1 request */
export const REQUEST_TIMEOUT_MS = 15000;

/** เกมถือว่า config พร้อมใช้เมื่อค่า placeholder ถูกแทนที่แล้ว */
export const isApiConfigured = () =>
  !API_BASE.startsWith('REPLACE_WITH') && !API_KEY.startsWith('REPLACE_WITH');
