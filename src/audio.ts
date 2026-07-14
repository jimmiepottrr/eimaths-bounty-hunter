import { ASSET_BASE } from './config';

/**
 * เฟส 4 — ระบบเสียงจากไฟล์จริง
 * · SFX (ตอบถูก 3 ระดับ / ตอบผิด): ไฟล์เล็ก อยู่ใน repo → public/assets/sfx
 * · เพลงประกอบ (ดินแดน/บอส/ชัยชนะ): ไฟล์ใหญ่ serve จาก VPS เหมือนอาร์ตเวิร์ก
 * เคารพปุ่มเปิด/ปิดเสียงของเกมผ่าน setAudioEnabled (store เป็นคน sync มา)
 */

let enabled = true;

// ---------- SFX ----------

export type SfxName = 'correct-1' | 'correct-2' | 'correct-3' | 'wrong';

const sfxUrl = (name: SfxName) => `${import.meta.env.BASE_URL}assets/sfx/${name}.mp3`;

const sfxCache = new Map<SfxName, HTMLAudioElement>();

export const playSfx = (name: SfxName, volume = 0.8): void => {
  if (!enabled) return;
  try {
    let base = sfxCache.get(name);
    if (!base) {
      base = new Audio(sfxUrl(name));
      base.preload = 'auto';
      sfxCache.set(name, base);
    }
    // clone เพื่อให้เสียงเล่นซ้อนกันได้ (กดเร็วๆ ต่อเนื่อง)
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = volume;
    void node.play().catch(() => {
      /* autoplay ถูกบล็อก — ข้ามเงียบๆ */
    });
  } catch {
    /* ไม่มี Audio (เช่น test env) — ข้าม */
  }
};

/** เลือกระดับความดีใจตามคอมโบจากเซิร์ฟเวอร์: 1-2 ธรรมดา · 3-4 ดีใจ · 5+ ดีใจมากๆ */
export const correctSfxForStreak = (streak: number): SfxName =>
  streak >= 5 ? 'correct-3' : streak >= 3 ? 'correct-2' : 'correct-1';

// ---------- เพลงประกอบ ----------

export type MusicTrack =
  | 'music-p3'
  | 'music-p4'
  | 'music-p5'
  | 'music-p6'
  | 'music-boss'
  | 'music-victory';

/** ที่อยู่ไฟล์เพลงบน VPS — override ได้ด้วย VITE_MUSIC_BASE */
/**
 * หมายเหตุ 2026-07-14: batch.html วางไฟล์เพลงไว้ที่ /staging/ (ยืนยันแล้วว่าเล่นได้จริง)
 * ถ้าย้ายเพลงไป /assets/music/ ในอนาคต ให้เปลี่ยน fallback นี้ หรือ set VITE_MUSIC_BASE ตอน build
 */
export const MUSIC_BASE: string =
  (import.meta.env.VITE_MUSIC_BASE as string | undefined) ??
  'https://srv1813136.hstgr.cloud/staging';

export const landTrack = (grade: number): MusicTrack =>
  (grade >= 3 && grade <= 6 ? `music-p${grade}` : 'music-p3') as MusicTrack;

const MUSIC_VOLUME = 0.32;
const FADE_MS = 500;

let musicEl: HTMLAudioElement | null = null;
let currentTrack: MusicTrack | null = null;
let fadeTimer: number | null = null;
let retryBound = false;

const clearFade = () => {
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
};

const fadeVolume = (el: HTMLAudioElement, target: number, ms: number, done?: () => void) => {
  clearFade();
  const start = el.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let step = 0;
  fadeTimer = window.setInterval(() => {
    step += 1;
    el.volume = Math.max(0, Math.min(1, start + ((target - start) * step) / steps));
    if (step >= steps) {
      clearFade();
      done?.();
    }
  }, 50);
};

/** เผื่อ autoplay โดนบล็อก — ลองเล่นซ้ำเมื่อผู้เล่นแตะหน้าจอครั้งถัดไป (ครั้งเดียว) */
const armRetryOnGesture = () => {
  if (retryBound) return;
  retryBound = true;
  const retry = () => {
    retryBound = false;
    document.removeEventListener('pointerdown', retry);
    if (enabled && musicEl && musicEl.paused && currentTrack) {
      void musicEl.play().catch(() => {});
    }
  };
  document.addEventListener('pointerdown', retry, { once: true });
};

export const playMusic = (track: MusicTrack, options?: { loop?: boolean }): void => {
  if (!enabled) return;
  const loop = options?.loop ?? track !== 'music-victory';
  if (currentTrack === track && musicEl && !musicEl.paused) return; // เล่นอยู่แล้ว

  const startNew = () => {
    try {
      const el = new Audio(`${MUSIC_BASE}/${track}.mp3`);
      el.loop = loop;
      el.volume = 0;
      musicEl = el;
      currentTrack = track;
      void el
        .play()
        .then(() => fadeVolume(el, MUSIC_VOLUME, FADE_MS))
        .catch(() => {
          el.volume = MUSIC_VOLUME;
          armRetryOnGesture();
        });
    } catch {
      /* ไม่มี Audio — ข้าม */
    }
  };

  if (musicEl && !musicEl.paused) {
    const old = musicEl;
    fadeVolume(old, 0, FADE_MS, () => {
      old.pause();
      startNew();
    });
  } else {
    startNew();
  }
};

export const stopMusic = (fadeMs = FADE_MS): void => {
  currentTrack = null;
  if (!musicEl) return;
  const el = musicEl;
  musicEl = null;
  fadeVolume(el, 0, fadeMs, () => el.pause());
};

/** store sync ค่าปุ่มเปิด/ปิดเสียงมาที่นี่ */
export const setAudioEnabled = (value: boolean): void => {
  enabled = value;
  if (!value) stopMusic(150);
};
