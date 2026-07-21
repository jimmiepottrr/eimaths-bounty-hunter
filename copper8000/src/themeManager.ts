/**
 * ธีมสีของเว็บ (ตั้งโดยแอดมิน มีผลกับผู้เข้าชมทุกคน)
 * - default = 'gold' (:root ใน theme.css) · 'copper' / 'silver' override ผ่าน [data-theme]
 * - ธีมไม่แตะสีแถบสินค้า (สีจริงของโลหะ) และสีราคาขึ้น/ลง
 * - cache ใน localStorage กันสีกะพริบตอนเปิดหน้า แล้ว sync ค่าจริงจาก backend อีกที
 */

import { dataService } from './data/service';

export type ThemeCode = 'gold' | 'copper' | 'silver';

export const THEME_CODES: ThemeCode[] = ['gold', 'copper', 'silver'];

const THEME_KEY = 'copper8000_theme';

export const applyTheme = (code: ThemeCode) => {
  document.documentElement.dataset.theme = code;
  localStorage.setItem(THEME_KEY, code);
};

export const currentTheme = (): ThemeCode => {
  const code = document.documentElement.dataset.theme as ThemeCode | undefined;
  return code && THEME_CODES.includes(code) ? code : 'gold';
};

/** เรียกก่อน render ครั้งแรก — ใช้ค่าที่ cache ไว้ */
export const initTheme = () => {
  const cached = localStorage.getItem(THEME_KEY) as ThemeCode | null;
  if (cached && THEME_CODES.includes(cached)) {
    document.documentElement.dataset.theme = cached;
  }
};

/** ดึงธีมจริงจาก backend (แอดมินอาจเพิ่งเปลี่ยน) — พังก็ใช้ค่าเดิมเงียบๆ */
export const syncThemeFromServer = async () => {
  try {
    const settings = await dataService.getSettings();
    const code = settings.theme as ThemeCode;
    if (THEME_CODES.includes(code) && code !== currentTheme()) applyTheme(code);
  } catch {
    /* ใช้ค่า cache/default ต่อไป */
  }
};
