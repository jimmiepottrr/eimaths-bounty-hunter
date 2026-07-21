/**
 * Config กลาง — ที่เดียวที่อ้าง API credentials (ห้าม hardcode ที่ไฟล์อื่น)
 * ตอน deploy จริง: ตั้ง GitHub Actions secrets COPPER_VITE_API_BASE / COPPER_VITE_API_KEY
 * (ส่งเข้ามาเป็น VITE_API_BASE / VITE_API_KEY ตอน build)
 * ถ้ายังไม่ตั้ง → แอปสลับเป็นโหมดสาธิต (mock adapter, ข้อมูลใน localStorage) อัตโนมัติ
 */

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'REPLACE_WITH_API_BASE';

export const API_KEY: string =
  (import.meta.env.VITE_API_KEY as string | undefined) ?? 'REPLACE_WITH_API_KEY';

export const REQUEST_TIMEOUT_MS = 15000;

export const isApiConfigured = () =>
  !API_BASE.startsWith('REPLACE_WITH') && !API_KEY.startsWith('REPLACE_WITH');
