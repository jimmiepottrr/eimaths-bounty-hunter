/**
 * ข้อมูลติดต่อบริษัท — แหล่งข้อมูลเดียว (ใช้ทั้ง footer และหน้าติดต่อ)
 * หมายเหตุ: ค่าปัจจุบันเป็นตัวอย่าง (placeholder) — แก้เป็นข้อมูลจริงได้ที่ไฟล์นี้ไฟล์เดียว
 */

/** ที่อยู่/ชื่อสถานที่ที่ใช้ค้นใน Google Maps */
export const MAP_QUERY = 'Copper 8000 Co., Ltd. บางนา กรุงเทพมหานคร';

/** ลิงก์เปิด Google Maps (กดได้ทั้งมือถือ/PC) */
export const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

/** แผนที่ฝัง (iframe) */
export const MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=15&output=embed`;

/** เบอร์โทร (label = ที่แสดง, tel = สำหรับลิงก์ tel:) */
export const PHONES = [
  { label: '02-000-8000', tel: '020008000' },
  { label: '081-800-8000', tel: '0818008000' },
];

/** LINE Official Account */
export const LINE_ID = '@copper8000';
/** ลิงก์เพิ่มเพื่อน LINE (กดแล้วเปิดแอป LINE) */
export const LINE_URL = 'https://line.me/R/ti/p/@copper8000';

export const EMAIL = 'contact@copper8000.co.th';
