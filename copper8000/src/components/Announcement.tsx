/**
 * ข้อความประกาศ (ตั้งโดยแอดมินในหน้าตั้งค่า) — แสดงเอาข้อความล่าสุดขึ้นมา
 * - โหมด 'marquee' : แถบอักษรวิ่งใต้เมนู
 * - โหมด 'popup'   : กล่องเด้งกลางจอตอนเปิดหน้า (ปิดได้)
 * ดึงค่าจาก backend ครั้งเดียวตอนเปิดแอป — พังก็เงียบ (ไม่มีประกาศ)
 */
import { useEffect, useState } from 'react';
import { dataService } from '../data/service';
import type { Announcement as AnnouncementData } from '../data/types';
import { useT } from '../i18n';

const Announcement = () => {
  const t = useT();
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    dataService
      .getSettings()
      .then((s) => {
        if (cancelled) return;
        const a = s.announcement;
        if (a && a.active && a.text.trim()) {
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

  if (!data) return null;

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
          <p className="announce-popup-text">{data.text}</p>
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

  // marquee: แถบอักษรวิ่งเต็มจอใต้เมนู — วิ่งขวา→ซ้าย จบแล้วเว้น 5 วิ ค่อยวนใหม่
  return (
    <div className="marquee-bar" role="status" aria-label={t('announce.barLabel')}>
      <div className="marquee-viewport">
        <div className="marquee-track">{data.text}</div>
      </div>
    </div>
  );
};

export default Announcement;
