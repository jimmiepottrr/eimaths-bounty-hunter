import { t } from './i18n/core';

/** locale ปัจจุบัน — I18nProvider เป็นคนตั้งผ่าน setLocale() ตอนเปลี่ยนภาษา */
let locale = 'th-TH';

export const setLocale = (l: string) => {
  locale = l;
};

const safeLocale = (): string => {
  try {
    new Intl.NumberFormat(locale);
    return locale;
  } catch {
    return 'en-US';
  }
};

export const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString(safeLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 2),
  });

export const fmtBaht = (n: number) => `${fmtNumber(n)} ${t('unit.baht')}`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(safeLocale(), { year: 'numeric', month: 'short', day: 'numeric' });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(safeLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const fmtToday = () =>
  new Date().toLocaleDateString(safeLocale(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** 'YYYY-MM' → ชื่อเดือนตามภาษา เช่น "ตุลาคม 2569" / "October 2026" */
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(safeLocale(), { year: 'numeric', month: 'long' });
};

/** 'YYYY-MM-DD' → วันที่ตามภาษา (อ่านเป็นวันที่ตรงๆ ไม่เลื่อนตาม timezone ของเครื่อง) */
export const fmtYmd = (ymd: string) => {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(safeLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
};
