/**
 * เวลาไทย (Asia/Bangkok) สำหรับตัดรอบเดือนค่าคอม — ใช้ในโหมดสาธิต (mock)
 * backend จริงคำนวณแบบเดียวกันใน PHP (_bootstrap.php: bkk_now / bkk_month)
 */

const ymd = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** วันนี้ (เวลาไทย) → YYYY-MM-DD */
export const bkkToday = (now: Date = new Date()): string => ymd(now);

/** เดือนของเวลาที่ให้มา (เวลาไทย) → YYYY-MM */
export const bkkMonthOf = (iso: string): string => ymd(new Date(iso)).slice(0, 7);

/** เดือนปัจจุบัน (เวลาไทย) → YYYY-MM */
export const bkkCurrentMonth = (now: Date = new Date()): string => bkkToday(now).slice(0, 7);

/** วันที่ 1 ของเดือนถัดไป (เวลาไทย) → YYYY-MM-DD */
export const bkkFirstOfNextMonth = (now: Date = new Date()): string => {
  const [y, m] = bkkToday(now).split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
};

/** ระยะล็อก: ห้ามแก้/ลบภายใน 30 วันหลังเกิดค่าคอม */
export const LOCK_DAYS = 30;
