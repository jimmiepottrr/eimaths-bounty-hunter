/**
 * I18nProvider — จัดการภาษาปัจจุบัน, รายชื่อภาษา (จาก backend/mock), geo-detect ครั้งแรก
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dataService } from '../data/service';
import type { LanguageInfo } from '../data/types';
import { setLocale } from '../format';
import {
  DEFAULT_LANG,
  dictFor,
  loadSavedLang,
  localeFor,
  registerDict,
  saveLang,
  setCurrentLang,
  t,
} from './core';
import { detectLang } from './geo';

export { t } from './core';

/** รายชื่อสำรองกรณีโหลดจาก backend ไม่ได้ (3 ภาษา built-in) */
const FALLBACK_LANGS: LanguageInfo[] = [
  { code: 'th', name_native: 'ไทย', enabled: true, built_in: true, sort_order: 1, dict: null },
  { code: 'en', name_native: 'English', enabled: true, built_in: true, sort_order: 2, dict: null },
  { code: 'zh', name_native: '中文(简体)', enabled: true, built_in: true, sort_order: 3, dict: null },
];

type I18nContextValue = {
  lang: string;
  setLang: (code: string) => void;
  languages: LanguageInfo[];
  reloadLanguages: () => Promise<void>;
  t: typeof t;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const applyLangGlobals = (code: string) => {
  setCurrentLang(code);
  setLocale(localeFor(code));
  document.documentElement.lang = code;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<string>(() => {
    const saved = loadSavedLang();
    const code = saved?.code ?? DEFAULT_LANG;
    applyLangGlobals(code);
    return code;
  });
  const [languages, setLanguages] = useState<LanguageInfo[]>(FALLBACK_LANGS);

  const setLang = useCallback((code: string, source: 'user' | 'geo' = 'user') => {
    applyLangGlobals(code);
    saveLang(code, source);
    setLangState(code);
  }, []);

  const reloadLanguages = useCallback(async () => {
    try {
      const list = await dataService.listLanguages();
      list.forEach((l) => {
        if (l.dict) registerDict(l.code, l.dict);
      });
      setLanguages(list);
      return;
    } catch {
      setLanguages(FALLBACK_LANGS);
    }
  }, []);

  // โหลดรายชื่อภาษา + geo-detect ครั้งแรก (ไม่ block การ render)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list: LanguageInfo[] = FALLBACK_LANGS;
      try {
        list = await dataService.listLanguages();
        list.forEach((l) => {
          if (l.dict) registerDict(l.code, l.dict);
        });
        if (!cancelled) setLanguages(list);
      } catch {
        /* ใช้ fallback */
      }
      const enabledCodes = list.filter((l) => l.enabled).map((l) => l.code);
      const saved = loadSavedLang();
      let target = saved?.code;
      let source: 'user' | 'geo' = saved?.source ?? 'user';
      if (!target) {
        target = await detectLang();
        source = 'geo';
      }
      if (!enabledCodes.includes(target)) {
        target = enabledCodes.includes('en')
          ? 'en'
          : enabledCodes.includes('th')
            ? 'th'
            : enabledCodes[0] ?? DEFAULT_LANG;
      }
      if (!cancelled) setLang(target, source);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang: (code) => setLang(code, 'user'), languages, reloadLanguages, t }),
    [lang, setLang, languages, reloadLanguages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n ต้องอยู่ภายใน <I18nProvider>');
  return ctx;
};

export const useT = () => useI18n().t;

/** ชื่อสินค้า: th ใช้ name_th, ภาษาอื่นใช้ name_en (fallback กลับหากันเอง) */
export const productName = (p: { name_th: string; name_en: string }, lang: string): string =>
  lang === 'th' ? p.name_th : p.name_en || p.name_th;

/** ชื่อรอง: โชว์ชื่ออังกฤษเฉพาะตอนดูภาษาไทย — ภาษาอื่นไม่โชว์ (กันตัวไทยโผล่หน้า EN/中文) */
export const productSubName = (p: { name_th: string; name_en: string }, lang: string): string =>
  lang === 'th' ? p.name_en : '';

/** ชื่อสินค้าในรายการจอง (backend ส่งทั้ง product_name ไทย + product_name_en) */
export const bookingProductName = (
  b: { product_name: string; product_name_en?: string | null },
  lang: string,
): string => (lang === 'th' ? b.product_name : b.product_name_en || b.product_name);
