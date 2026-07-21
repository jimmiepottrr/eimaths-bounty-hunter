/** ตัวเลือกภาษา (ขวาบนของทุกหน้า) — โชว์ชื่อภาษาในตัวอักษรของภาษานั้น */

import { useI18n } from '../i18n';

const LanguagePicker = () => {
  const { lang, setLang, languages, t } = useI18n();
  const enabled = languages.filter((l) => l.enabled);

  return (
    <span className="lang-picker">
      <span aria-hidden="true">🌐</span>
      <select aria-label={t('lang.picker')} value={lang} onChange={(e) => setLang(e.target.value)}>
        {enabled.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name_native}
          </option>
        ))}
        {/* กันกรณีภาษาปัจจุบันถูกปิดไปแล้วแต่ยังแสดงอยู่ */}
        {!enabled.some((l) => l.code === lang) && <option value={lang}>{lang}</option>}
      </select>
    </span>
  );
};

export default LanguagePicker;
