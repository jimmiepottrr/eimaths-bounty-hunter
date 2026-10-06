/**
 * เวลาไทย (Asia/Bangkok) สำหรับตัดรอบเดือนค่าคอม — ใช้ในโหมดสาธิต (mock)
 * backend จริงคำนวณแบบเดียวกันใน PHP (_bootstrap.php: bkk_now / bkk_current_month)
 */

const ymd = (d: Date): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** เดือนของเวลาที่ให้มา (เวลาไทย) → YYYY-MM */
export const bkkMonthOf = (iso: string): string => ymd(new Date(iso)).slice(0, 7);

/** เดือนปัจจุบัน (เวลาไทย) → YYYY-MM */
export const bkkCurrentMonth = (now: Date = new Date()): string => ymd(now).slice(0, 7);
