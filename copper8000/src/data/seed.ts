import type { Booking, LanguageInfo, Product, User } from './types';

/** ข้อมูลตั้งต้นของโหมดสาธิต (mock adapter) — ราคาเป็นบาท/กก. */

export type SeedUser = User & { password: string };

export const SEED_USERS: SeedUser[] = [
  {
    id: 1,
    email: 'admin@copper8000.co.th',
    password: 'admin1234',
    name: 'ผู้ดูแลระบบ',
    phone: '02-000-8000',
    role: 'admin',
    approved: true,
  },
  {
    id: 2,
    email: 'demo@copper8000.co.th',
    password: 'demo1234',
    name: 'คุณเดโม่ ทดลองจอง',
    phone: '081-000-0002',
    role: 'user',
    approved: true,
  },
  {
    id: 3,
    email: 'pending@copper8000.co.th',
    password: 'demo1234',
    name: 'คุณรอ อนุมัติ',
    phone: '081-000-0003',
    role: 'user',
    approved: false,
  },
];

const now = () => new Date().toISOString();

export const SEED_PRODUCTS: Product[] = [
  { id: 1, material: 'copper', name_th: 'ทองแดงเงา (เบอร์ 1)', name_en: 'Bright Copper #1', price_per_kg: 285, prev_price_per_kg: 282, high_of_day: 288, low_of_day: 280, updated_at: now() },
  { id: 2, material: 'copper', name_th: 'ทองแดงช็อต', name_en: 'Copper Shot', price_per_kg: 272, prev_price_per_kg: 273, high_of_day: 275, low_of_day: 270, updated_at: now() },
  { id: 3, material: 'copper', name_th: 'ทองแดงหนา (เบอร์ 2)', name_en: 'Heavy Copper #2', price_per_kg: 260, prev_price_per_kg: 258, high_of_day: 263, low_of_day: 256, updated_at: now() },
  { id: 4, material: 'brass', name_th: 'ทองเหลืองหนา', name_en: 'Heavy Brass', price_per_kg: 185, prev_price_per_kg: 183, high_of_day: 187, low_of_day: 181, updated_at: now() },
  { id: 5, material: 'brass', name_th: 'ทองเหลืองบาง / ฝอย', name_en: 'Light Brass', price_per_kg: 172, prev_price_per_kg: 173, high_of_day: 175, low_of_day: 170, updated_at: now() },
  { id: 6, material: 'aluminium', name_th: 'อลูมิเนียมหนา', name_en: 'Heavy Aluminium', price_per_kg: 62, prev_price_per_kg: 61, high_of_day: 63, low_of_day: 60, updated_at: now() },
  { id: 7, material: 'aluminium', name_th: 'อลูมิเนียมฉาก / เส้น', name_en: 'Aluminium Profile', price_per_kg: 55, prev_price_per_kg: 55, high_of_day: 56, low_of_day: 54, updated_at: now() },
  { id: 8, material: 'aluminium', name_th: 'กระป๋องอลูมิเนียม', name_en: 'Aluminium Cans', price_per_kg: 38, prev_price_per_kg: 39, high_of_day: 40, low_of_day: 37, updated_at: now() },
];

export const SEED_LANGUAGES: LanguageInfo[] = [
  { code: 'th', name_native: 'ไทย', enabled: true, built_in: true, sort_order: 1, dict: null },
  { code: 'en', name_native: 'English', enabled: true, built_in: true, sort_order: 2, dict: null },
  { code: 'zh', name_native: '中文(简体)', enabled: true, built_in: true, sort_order: 3, dict: null },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 1,
    user_id: 2,
    user_name: 'คุณเดโม่ ทดลองจอง',
    product_id: 1,
    product_name: 'ทองแดงเงา (เบอร์ 1)',
    product_name_en: 'Bright Copper #1',
    quantity: 2,
    unit: 'ton',
    price_at_booking: 282,
    total_estimate: 564000,
    status: 'confirmed',
    created_at: daysAgo(2),
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'คุณเดโม่ ทดลองจอง',
    product_id: 4,
    product_name: 'ทองเหลืองหนา',
    product_name_en: 'Heavy Brass',
    quantity: 500,
    unit: 'kg',
    price_at_booking: 183,
    total_estimate: 91500,
    status: 'pending',
    created_at: daysAgo(1),
  },
];
