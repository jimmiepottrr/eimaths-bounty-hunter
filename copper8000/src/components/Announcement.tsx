/**
 * ข้อความประกาศ (ตั้งโดยแอดมินในหน้าตั้งค่า) — แสดงเอาข้อความล่าสุดขึ้นมา
 * - โหมด 'marquee': PC = แถบอักษรวิ่งใต้เมนู · มือถือ = การ์ดแจ้งเตือนลอยด้านล่าง
 * - โหมด 'popup'  : กล่องเด้งกลางจอตอนเปิดหน้า
 * ข้อความในการ์ด/popup พิมพ์ทีละตัวเหมือนบอทกำลังพิมพ์ แล้วค้างไว้จนกดปิด
 * ดึงค่าจาก backend ครั้งเดียวตอนเปิดแอป — พังก็เงียบ (ไม่มีประกาศ)
 */
import { useEffect, useRef, useState } from 'react';
import { dataService } from '../data/service';
import type { Announcement as AnnouncementData } from '../data/types';
import { useT } from '../i18n';

/** true เมื่อจอมือถือ (<=680px) — ฟังการเปลี่ยนขนาด */
const useIsMobile = (): boolean => {
  const query = '(max-width: 680px)';
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
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

const BotAvatar = () => (
  // วงกลมพื้นหลัง = สีเมนู (ทอง) จาก .marquee-fab-icon · หน้าหุ่นยนต์สีขาว หูฟังเข้มกรอบหน้า
  <svg viewBox="0 0 48 48" className="marquee-bot" role="img" aria-hidden="true">
    <path d="M13 23a11 11 0 0 1 22 0" fill="none" stroke="#2a2e48" strokeWidth="2.4" />
    <rect x="8.5" y="22" width="5" height="8.5" rx="2.5" fill="#2a2e48" />
    <rect x="34.5" y="22" width="5" height="8.5" rx="2.5" fill="#2a2e48" />
    <line x1="24" y1="18" x2="24" y2="12.5" stroke="#2a2e48" strokeWidth="2" />
    <circle cx="24" cy="11.5" r="2.1" fill="#2f80ed" />
    <rect x="13.5" y="18" width="21" height="16.5" rx="7.5" fill="#ffffff" />
    <circle cx="19.5" cy="26" r="2.7" fill="#2f80ed" />
    <circle cx="28.5" cy="26" r="2.7" fill="#2f80ed" />
    <path d="M19.5 30.5q4.5 3 9 0" fill="none" stroke="#8fa0c0" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Announcement = () => {
  const t = useT();
  const isMobile = useIsMobile();
  const [data, setData] = useState<AnnouncementData | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [marqueeClosed, setMarqueeClosed] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

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
    // มือถือ: การ์ดลอยด้านล่าง — เว้นที่ท้ายเนื้อหาไม่ให้โดนบัง (เฉพาะตอนการ์ดโชว์)
    document.body.classList.toggle('has-bottom-marquee', isMarquee && isMobile && !marqueeClosed);
    return () => document.body.classList.remove('has-bottom-marquee');
  }, [isMarquee, isMobile, marqueeClosed]);

  const text = data?.text ?? '';
  // popup: พิมพ์ทีละตัวตอนเปิด · การ์ดมือถือ: พิมพ์ทีละตัว · แถบวิ่ง PC: แสดงเต็ม (วิ่ง)
  const popupType = useTypewriter(text, !!data && data.mode === 'popup' && popupOpen);
  const cardType = useTypewriter(text, isMarquee && isMobile && !marqueeClosed);

  // มือถือ: เลื่อนกล่องตามตัวอักษรที่กำลังพิมพ์เสมอ (เหมือนแชท)
  useEffect(() => {
    const el = viewportRef.current;
    if (el && isMobile) el.scrollTop = el.scrollHeight;
  }, [cardType.shown, isMobile]);

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

  // marquee mode
  const marqueeText = isMobile ? cardType.shown : text;
  const showCaret = isMobile && !cardType.done;

  // ปุ่ม × ปิดเฉพาะการ์ดมือถือ — desktop แถบวิ่งใต้เมนูแสดงเสมอ (ไม่ได้รับผลจากการกดปิดบนมือถือ)
  if (marqueeClosed && isMobile) return null;
  return (
    <div className="marquee-bar" role="status" aria-label={t('announce.barLabel')}>
      <span className="marquee-fab-icon">
        <BotAvatar />
      </span>
      <div className="marquee-bubble">
        <div className="marquee-viewport" ref={viewportRef}>
          <div className="marquee-track">
            {marqueeText}
            {showCaret && <span className="type-caret" aria-hidden="true" />}
          </div>
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
    </div>
  );
};

export default Announcement;
