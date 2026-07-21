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
