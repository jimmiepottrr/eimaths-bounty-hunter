import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, Player, setAuthErrorHandler, setAuthToken } from './api';

/**
 * Store เฟส 2 — เซสชัน/คะแนน/เหรียญมาจากเซิร์ฟเวอร์ทั้งหมด (client แสดงผลอย่างเดียว)
 * ที่เก็บใน localStorage มีแค่: token + ข้อมูลผู้เล่นล่าสุด + ความคืบหน้าปลดล็อกฉาก (ต่อผู้เล่น)
 */

type UnlockProgress = {
  /** จำนวนฉากปกติที่เคลียร์แล้วของชั้นนั้น (0..4) */
  clearedScenes: number;
  bossCleared: boolean;
};

type SoundName = 'tap' | 'success' | 'error' | 'reward' | 'level';

type AppContextValue = {
  player: Player | null;
  token: string | null;
  isLoggedIn: boolean;
  authError: string;
  loginStudent: (studentCode: string, pin: string) => Promise<void>;
  loginGuest: (nickname: string, grade: number) => Promise<void>;
  logout: () => void;
  /** อัปเดตยอดเหรียญตามค่าที่ API ตอบกลับ (ไม่คำนวณเอง) */
  syncCoins: (coinsFromServer: number) => void;
  progressFor: (grade: number) => UnlockProgress;
  markSceneCleared: (grade: number, scene: number) => void;
  markBossCleared: (grade: number) => void;
  hasWatchedCutscene: (id: string) => boolean;
  markCutsceneWatched: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (name: SoundName) => void;
  playIntroSound: () => void;
  stopIntroSound: () => void;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const TOKEN_KEY = 'bh2-token';
const PLAYER_KEY = 'bh2-player';
const PROGRESS_KEY = 'bh2-progress';
const CUTSCENE_KEY = 'bh2-cutscenes';

// ---------- Sound engine (คงของเดิมจาก demo) ----------

let audioContext: AudioContext | null = null;
let introSources: OscillatorNode[] = [];

const playTone = (name: SoundName, enabled: boolean) => {
  if (!enabled) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  audioContext = audioContext || new AudioCtor();
  const context = audioContext;
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  const patterns: Record<SoundName, number[]> = {
    tap: [520],
    success: [620, 820, 1040],
    error: [220, 160],
    reward: [660, 880, 1100, 1320],
    level: [440, 660, 880],
  };

  patterns[name].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = name === 'error' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.07);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.07);
    oscillator.stop(now + index * 0.07 + 0.08);
  });
};

const stopIntroScore = () => {
  introSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  });
  introSources = [];
};

const playIntroScore = (enabled: boolean) => {
  if (!enabled) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  stopIntroScore();
  audioContext = audioContext || new AudioCtor();
  const context = audioContext;
  void context.resume();
  const now = context.currentTime;
  const master = context.createGain();
  master.connect(context.destination);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.6);
  master.gain.setValueAtTime(0.12, now + 14.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 17.5);

  const beat = 60 / 138;
  const whistleMelody = [659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25, 523.25];
  const banjoPattern = [261.63, 329.63, 392, 523.25, 293.66, 369.99, 440, 587.33];
  const bass = [130.81, 146.83, 110, 123.47];

  const scheduleNote = (
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(noteGain);
    noteGain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    introSources.push(oscillator);
  };

  for (let step = 0; step < 40; step += 1) {
    const start = now + step * beat;
    const phrase = Math.floor(step / 8);
    if (step % 2 === 0) {
      scheduleNote(
        whistleMelody[(step / 2 + phrase * 2) % whistleMelody.length],
        start,
        beat * 1.65,
        0.11,
        'sine',
      );
    }

    scheduleNote(
      bass[Math.floor(step / 4) % bass.length],
      start,
      beat * 0.75,
      step % 4 === 0 ? 0.13 : 0.08,
      'triangle',
    );

    scheduleNote(banjoPattern[(step + phrase) % banjoPattern.length] * 2, start, beat * 0.2, 0.07, 'square');
    scheduleNote(
      banjoPattern[(step + phrase + 2) % banjoPattern.length] * 2,
      start + beat * 0.5,
      beat * 0.17,
      0.055,
      'square',
    );

    const kick = context.createOscillator();
    const kickGain = context.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(step % 4 === 0 ? 118 : 92, start);
    kick.frequency.exponentialRampToValueAtTime(46, start + 0.16);
    kickGain.gain.setValueAtTime(step % 4 === 0 ? 0.25 : 0.15, start);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    kick.connect(kickGain);
    kickGain.connect(master);
    kick.start(start);
    kick.stop(start + 0.22);
    introSources.push(kick);

    if (step % 4 === 2) {
      scheduleNote(196, start, 0.1, 0.07, 'sawtooth');
    }

    if (step % 8 === 0) {
      const chordRoot = bass[Math.floor(step / 8) % bass.length] * 2;
      [1, 1.25, 1.5].forEach((ratio) => {
        scheduleNote(chordRoot * ratio, start, beat * 6.8, 0.035, 'sawtooth');
      });
    }
  }

  [0, 5.2, 10.8].forEach((offset, fanfareIndex) => {
    [392, 523.25, 659.25, 783.99].forEach((frequency, noteIndex) => {
      scheduleNote(
        frequency * (fanfareIndex === 2 ? 1.12 : 1),
        now + offset + noteIndex * 0.12,
        0.9,
        0.11,
        'sawtooth',
      );
    });
  });
};

// ---------- Storage helpers ----------

const readPlayer = (): Player | null => {
  try {
    const raw = window.localStorage.getItem(PLAYER_KEY);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
};

type ProgressMap = Record<string, Record<number, UnlockProgress>>;

const readProgressMap = (): ProgressMap => {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
};

const playerKeyOf = (player: Player | null) => (player ? `${player.type}-${player.id}` : 'anon');

// ---------- Context ----------

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => window.localStorage.getItem(TOKEN_KEY));
  const [player, setPlayer] = useState<Player | null>(() => readPlayer());
  const [authError, setAuthError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progressVersion, setProgressVersion] = useState(0);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    // 401 จากทุก endpoint → เคลียร์เซสชัน + เด้งกลับหน้า login (RequireSession จัดการ redirect)
    setAuthErrorHandler(() => {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(PLAYER_KEY);
      setToken(null);
      setPlayer(null);
      setAuthError('เซสชันหมดอายุ เข้าสู่ระบบใหม่อีกครั้งนะ');
    });
    return () => setAuthErrorHandler(null);
  }, []);

  const persistSession = (nextToken: string, nextPlayer: Player) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(PLAYER_KEY, JSON.stringify(nextPlayer));
    setAuthToken(nextToken);
    setToken(nextToken);
    setPlayer(nextPlayer);
    setAuthError('');
  };

  const value = useMemo<AppContextValue>(() => {
    const progressMap = readProgressMap();
    const key = playerKeyOf(player);

    return {
      player,
      token,
      isLoggedIn: Boolean(token && player),
      authError,

      loginStudent: async (studentCode, pin) => {
        const result = await api.loginStudent(studentCode.trim(), pin.trim());
        persistSession(result.token, result.player);
        playTone('success', soundEnabled);
      },

      loginGuest: async (nickname, grade) => {
        const result = await api.loginGuest(nickname.trim(), grade);
        persistSession(result.token, result.player);
        playTone('success', soundEnabled);
      },

      logout: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(PLAYER_KEY);
        setAuthToken(null);
        setToken(null);
        setPlayer(null);
        setAuthError('');
        playTone('tap', soundEnabled);
      },

      syncCoins: (coinsFromServer) => {
        setPlayer((current) => {
          if (!current) return current;
          const next = { ...current, coins: coinsFromServer };
          window.localStorage.setItem(PLAYER_KEY, JSON.stringify(next));
          return next;
        });
      },

      progressFor: (grade) => progressMap[key]?.[grade] ?? { clearedScenes: 0, bossCleared: false },

      markSceneCleared: (grade, scene) => {
        const map = readProgressMap();
        const current = map[key]?.[grade] ?? { clearedScenes: 0, bossCleared: false };
        const next = { ...current, clearedScenes: Math.max(current.clearedScenes, scene) };
        map[key] = { ...(map[key] ?? {}), [grade]: next };
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
        setProgressVersion((version) => version + 1);
      },

      markBossCleared: (grade) => {
        const map = readProgressMap();
        const current = map[key]?.[grade] ?? { clearedScenes: 0, bossCleared: false };
        map[key] = { ...(map[key] ?? {}), [grade]: { ...current, bossCleared: true } };
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
        setProgressVersion((version) => version + 1);
      },

      hasWatchedCutscene: (id) => {
        try {
          const list: string[] = JSON.parse(window.localStorage.getItem(CUTSCENE_KEY) ?? '[]');
          return list.includes(`${key}:${id}`);
        } catch {
          return false;
        }
      },

      markCutsceneWatched: (id) => {
        try {
          const list: string[] = JSON.parse(window.localStorage.getItem(CUTSCENE_KEY) ?? '[]');
          const entry = `${key}:${id}`;
          if (!list.includes(entry)) {
            list.push(entry);
            window.localStorage.setItem(CUTSCENE_KEY, JSON.stringify(list));
          }
        } catch {
          // storage may be unavailable — ignore
        }
      },

      soundEnabled,
      toggleSound: () => {
        setSoundEnabled((current) => {
          playTone('tap', !current);
          return !current;
        });
      },
      playSound: (name) => playTone(name, soundEnabled),
      playIntroSound: () => playIntroScore(soundEnabled),
      stopIntroSound: stopIntroScore,
    };
    // progressVersion บังคับให้ context สร้างใหม่เมื่อความคืบหน้าเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, token, authError, soundEnabled, progressVersion]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppState must be used inside AppProvider');
  }
  return value;
};

export { ApiError };
