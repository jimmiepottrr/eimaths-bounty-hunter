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
  const [marqueeClosed, setMarqueeClosed] = useState(false);

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

  const isMarquee = !!data && data.mode === 'marquee';
  useEffect(() => {
    // บนมือถือแถบวิ่งเป็น fixed ล่างจอ — ใส่คลาสที่ body เพื่อเว้นที่ท้ายเนื้อหาไม่ให้โดนบัง
    document.body.classList.toggle('has-bottom-marquee', isMarquee);
    return () => document.body.classList.remove('has-bottom-marquee');
  }, [isMarquee]);

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

  // marquee: PC = แถบอักษรวิ่งเต็มจอใต้เมนู (ขวา→ซ้าย เว้น 5 วิวนใหม่)
  //          มือถือ = การ์ดแจ้งเตือนลอยด้านล่าง (ไอคอน + ข้อความ + ปุ่มปิด)
  if (marqueeClosed) return null;
  return (
    <div className="marquee-bar" role="status" aria-label={t('announce.barLabel')}>
      <span className="marquee-fab-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="marquee-bot" role="img">
          <circle cx="24" cy="24" r="24" fill="#2a2e48" />
          <path d="M13 23a11 11 0 0 1 22 0" fill="none" stroke="#cfd6e6" strokeWidth="2.4" />
          <rect x="8.5" y="22" width="5" height="8.5" rx="2.5" fill="#cfd6e6" />
          <rect x="34.5" y="22" width="5" height="8.5" rx="2.5" fill="#cfd6e6" />
          <line x1="24" y1="18" x2="24" y2="12.5" stroke="#cfd6e6" strokeWidth="2" />
          <circle cx="24" cy="11.5" r="2.1" fill="#4aa8ff" />
          <rect x="13.5" y="18" width="21" height="16.5" rx="7.5" fill="#eef2fb" />
          <circle cx="19.5" cy="26" r="2.7" fill="#3aa0ff" />
          <circle cx="28.5" cy="26" r="2.7" fill="#3aa0ff" />
          <path d="M19.5 30.5q4.5 3 9 0" fill="none" stroke="#9fb2d4" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <div className="marquee-viewport">
        <div className="marquee-track">{data.text}</div>
      </div>
      <button
        type="button"
        className="marquee-close"
        aria-label={t('announce.close')}
        onClick={() => setMarqueeClosed(true)}
      >
        ×
      </button>
    </div>
  );
};

export default Announcement;
