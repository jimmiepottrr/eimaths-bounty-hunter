/**
 * ตัวเลือกภาษา (ขวาบนทุกหน้า)
 * เดสก์ท็อป: โชว์ชื่อภาษาเต็ม (ไทย / English / 中文) · มือถือ: โชว์เฉพาะรหัส (TH / EN / ZH)
 * — สลับด้วย CSS (.lang-select-full / .lang-select-code)
 */

import { useI18n } from '../i18n';

const LanguagePicker = () => {
  const { lang, setLang, languages, t } = useI18n();
  const enabled = languages.filter((l) => l.enabled);
  const currentMissing = !enabled.some((l) => l.code === lang);

  return (
    <span className="lang-picker">
      <span aria-hidden="true">🌐</span>
      <select
        className="lang-select-full"
        aria-label={t('lang.picker')}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {enabled.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name_native}
          </option>
        ))}
        {currentMissing && <option value={lang}>{lang}</option>}
      </select>
      <select
        className="lang-select-code"
        aria-label={t('lang.picker')}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {enabled.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code.toUpperCase()}
          </option>
        ))}
        {currentMissing && <option value={lang}>{lang.toUpperCase()}</option>}
      </select>
    </span>
  );
};

export default LanguagePicker;
