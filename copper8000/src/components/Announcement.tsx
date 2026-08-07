/**
 * ข้อความประกาศ (ตั้งโดยแอดมินในหน้าตั้งค่า) — แสดงข้อความล่าสุดขึ้นมา
 * โหมดเลือกได้อย่างใดอย่างหนึ่งเท่านั้น (ไม่ซ้อนกัน):
 * - 'marquee': แถบอักษรวิ่งใต้เมนู (ทั้ง PC และมือถือ) — ไม่มี popup
 * - 'popup'  : กล่องเด้งกลางจอตอนเปิดหน้า (พิมพ์ทีละตัว) — ไม่มีแถบวิ่ง
 * ดึงค่าจาก backend ครั้งเดียวตอนเปิดแอป — พังก็เงียบ (ไม่มีประกาศ)
 */
import { useEffect, useState } from 'react';
import { dataService } from '../data/service';
import type { AnnounceText, Announcement as AnnouncementData } from '../data/types';
import { useI18n } from '../i18n';

/** เลือกข้อความตามภาษาปัจจุบัน — ว่างก็ fallback: ภาษาปัจจุบัน → ไทย → ภาษาแรกที่มีข้อความ */
const textForLang = (m: AnnounceText, lang: string): string => {
  const byLang = m[lang];
  if (byLang && byLang.trim()) return byLang;
  if (m.th && m.th.trim()) return m.th;
  return Object.values(m).find((v) => v && v.trim()) ?? '';
};

/** พิมพ์ข้อความทีละตัว (เหมือนบอทกำลังพิมพ์) — พิมพ์ครบแล้วค้างไว้ ไม่วนซ้ำ */
const useTypewriter = (text: string, active: boolean, speed = 78) => {
  const [count, setCount] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) {
      setCount(text.length);
      return;
    }
    setCount(0);
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, active, speed]);
  return { shown: text.slice(0, count), done: count >= text.length };
};

const Announcement = () => {
  const { lang, t } = useI18n();
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dataService
      .getSettings()
      .then((s) => {
        if (cancelled) return;
        const a = s.announcement;
        const hasText = !!a && Object.values(a.text).some((v) => v && v.trim());
        if (a && a.active && hasText) {
          setData(a);
          if (a.mode === 'popup') setPopupOpen(true);
        }
      })
      .catch(() => {
        /* ไม่มีประกาศก็ปล่อยผ่าน */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ข้อความตามภาษาที่เลือก — เปลี่ยนภาษาแล้ว text เปลี่ยน → แถบวิ่งข้อความใหม่ / popup พิมพ์ใหม่
  const text = data ? textForLang(data.text, lang) : '';
  const popupType = useTypewriter(text, !!data && data.mode === 'popup' && popupOpen);

  if (!data) return null;

  // ---- โหมด popup: กล่องเด้งกลางจอ (ไม่มีแถบวิ่ง) ----
  if (data.mode === 'popup') {
    if (!popupOpen) return null;
    return (
      <div className="announce-overlay" role="dialog" aria-modal="true" onClick={() => setPopupOpen(false)}>
        <div className="announce-popup" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="announce-popup-x"
            aria-label={t('announce.close')}
            onClick={() => setPopupOpen(false)}
          >
            ×
          </button>
          <div className="announce-popup-badge" aria-hidden="true">
            📢
          </div>
          <div className="announce-popup-title">{t('announce.popupTitle')}</div>
          <p className="announce-popup-text">
            {popupType.shown}
            {!popupType.done && <span className="type-caret" aria-hidden="true" />}
          </p>
          <button
            type="button"
            className="btn btn-primary announce-popup-btn"
            onClick={() => setPopupOpen(false)}
          >
            {t('announce.close')}
          </button>
        </div>
      </div>
    );
  }

  // ---- โหมด marquee: แถบอักษรวิ่งใต้เมนู (ทั้ง PC และมือถือ · ไม่มี popup) ----
  return (
    <div className="marquee-bar" role="status" aria-label={t('announce.barLabel')}>
      <div className="marquee-bubble">
        <div className="marquee-viewport">
          <div className="marquee-track">{text}</div>
        </div>
      </div>
    </div>
  );
};

export default Announcement;
