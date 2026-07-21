/**
 * i18n core (singleton) — ไม่พึ่ง React เพื่อให้ httpAdapter/format ใช้ t() ได้
 * ระวัง: ห้าม import จาก data/* ในไฟล์นี้ (กัน circular import)
 */

export type Dict = Record<string, string>;

import { en } from './dictionaries/en';
import { th } from './dictionaries/th';
import { zh } from './dictionaries/zh';

export const BUILT_IN_DICTS: Record<string, Dict> = { th, en, zh };

/** template สำหรับ prefill ภาษาใหม่ในหน้าแอดมิน */
export const DICT_TEMPLATE: Dict = en;

export const DEFAULT_LANG = 'th';

const LOCALES: Record<string, string> = { th: 'th-TH', en: 'en-US', zh: 'zh-CN' };

const LANG_KEY = 'copper8000_lang';

type SavedLang = { code: string; source: 'user' | 'geo' };

let currentLang = DEFAULT_LANG;
let currentDict: Dict = th;
const customDicts: Record<string, Dict> = {};

export const getLang = () => currentLang;

export const registerDict = (code: string, dict: Dict) => {
  customDicts[code] = dict;
};

export const dictFor = (code: string): Dict => BUILT_IN_DICTS[code] ?? customDicts[code] ?? en;

export const hasDict = (code: string): boolean => !!(BUILT_IN_DICTS[code] ?? customDicts[code]);

export const localeFor = (code: string): string => LOCALES[code] ?? code;

export const setCurrentLang = (code: string) => {
  currentLang = code;
  currentDict = dictFor(code);
};

/** แปลข้อความ — fallback: dict ภาษาปัจจุบัน → English → ตัว key เอง · รองรับ {param} */
export const t = (key: string, params?: Record<string, string | number>): string => {
  let s = currentDict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
};

export const loadSavedLang = (): SavedLang | null => {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    return raw ? (JSON.parse(raw) as SavedLang) : null;
  } catch {
    return null;
  }
};

export const saveLang = (code: string, source: 'user' | 'geo') => {
  localStorage.setItem(LANG_KEY, JSON.stringify({ code, source } satisfies SavedLang));
};
