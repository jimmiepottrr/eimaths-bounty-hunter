/**
 * เดาภาษาเริ่มต้นจากประเทศของ IP ผู้เข้าชม (เรียกเฉพาะครั้งแรกที่ยังไม่เคยเลือกภาษา)
 * ล้มเหลว (adblock/offline/rate limit) → fallback เป็นภาษาเบราว์เซอร์แบบเงียบๆ ไม่ block การ render
 */

const GEO_ENDPOINT = 'https://ipwho.is/?fields=country_code';

const ZH_COUNTRIES = ['CN', 'TW', 'HK', 'MO'];

const fromNavigator = (): string => {
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('th')) return 'th';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('en')) return 'en';
  return 'th';
};

export const detectLang = async (): Promise<string> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(GEO_ENDPOINT, { signal: controller.signal });
    clearTimeout(timer);
    const data = (await res.json()) as { country_code?: string };
    const cc = String(data?.country_code ?? '').toUpperCase();
    if (cc === 'TH') return 'th';
    if (ZH_COUNTRIES.includes(cc)) return 'zh';
    if (cc) return 'en';
  } catch {
    // เงียบๆ แล้วใช้ภาษาเบราว์เซอร์แทน
  }
  return fromNavigator();
};
