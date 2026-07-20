/**
 * API client — ทุก request วิ่งผ่านไฟล์นี้ไฟล์เดียว
 * Contract ตาม COWORK-BRIEF ข้อ 2 (เฟส 1 — ห้ามแก้ฝั่งเซิร์ฟเวอร์)
 *
 * กติกา:
 * - แนบ X-Api-Key ทุก request · แนบ Authorization: Bearer <token> หลังล็อกอิน
 * - client แสดงผลอย่างเดียว ห้ามคำนวณคะแนนเอง
 * - error ทุกแบบต้องกลายเป็น ApiError ที่มีข้อความไทยให้เด็กอ่านรู้เรื่อง
 * - 401 → เคลียร์ session แล้วส่งผู้เล่นกลับหน้า login (จัดการใน store)
 */

import { API_BASE, API_KEY, REQUEST_TIMEOUT_MS } from './config';

// ---------- Types ตาม contract ----------

export type Player = {
  id: number;
  type: 'student' | 'guest';
  nickname: string;
  grade: number;
  coins: number;
  line_verified?: boolean;
  items?: unknown[];
};

export type AuthResponse = {
  ok: true;
  token: string;
  player: Player;
};

export type QuizQuestion = {
  no: number;
  qid: number;
  difficulty: number;
  text: string;
  choices: { a: string; b: string; c: string; d: string };
  hint?: string;
};

export type BossInfo = { hp: number; hearts: number };

export type QuizStartResponse = {
  ok: true;
  session_id: string;
  mode: 'normal' | 'boss';
  time_limit_sec: number;
  boss?: BossInfo;
  questions: QuizQuestion[];
};

export type EarnedInfo = {
  score: number;
  coins: number;
  speed_tier: 'fast' | 'normal' | 'slow' | string;
  multipliers?: Record<string, number>;
};

export type SessionInfo = {
  streak: number;
  score_total: number;
  coins_total: number;
  boss_hp?: number;
  hearts?: number;
  result?: string;
};

export type FinishInfo = {
  result: 'win' | 'lose' | 'done' | string;
  bonus?: number;
  accuracy?: number;
};

export type QuizAnswerResponse = {
  ok: true;
  correct: boolean;
  correct_choice: 'a' | 'b' | 'c' | 'd';
  explanation?: string;
  earned: EarnedInfo;
  session: SessionInfo;
  finished: boolean;
  finish?: FinishInfo;
};

export type RewardItem = {
  id: number | string;
  name: string;
  cost: number;
  description?: string;
  icon?: string;
};

export type RewardCatalogResponse = { ok: true; rewards?: RewardItem[]; catalog?: RewardItem[] };
export type RewardRedeemResponse = { ok: true; message?: string; coins?: number };

// เฉลยเฉพาะบัญชีผู้ตรวจ (QC) — server เป็นคน gate, ผู้เล่นปกติเรียกแล้วได้ 403
export type QuizRevealResponse = { ok: true; answers: Record<string, string> };

// ---------- Error ----------

export class ApiError extends Error {
  status: number;
  isAuthError: boolean;
  isNetworkError: boolean;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAuthError = status === 401;
    this.isNetworkError = status === 0;
  }
}

type Json = Record<string, unknown>;

let authToken: string | null = null;
let onAuthError: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** store ลงทะเบียน handler ไว้ — โดน 401 เมื่อไหร่ เคลียร์ session แล้วเด้งกลับ login */
export const setAuthErrorHandler = (handler: (() => void) | null) => {
  onAuthError = handler;
};

const request = async <T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: Json } = {},
): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    window.clearTimeout(timer);
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('เชื่อมต่อนานเกินไป ลองใหม่อีกครั้งนะ', 0);
    }
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่นะ', 0);
  } finally {
    window.clearTimeout(timer);
  }

  let data: Json | null = null;
  try {
    data = (await response.json()) as Json;
  } catch {
    data = null;
  }

  if (response.status === 401) {
    onAuthError?.();
    throw new ApiError((data?.error as string) || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
  }

  if (!response.ok || !data || data.ok !== true) {
    throw new ApiError(
      (data?.error as string) || 'มีบางอย่างผิดพลาด ลองใหม่อีกครั้งนะ',
      response.status,
    );
  }

  return data as T;
};

// ---------- Endpoints ----------

export const api = {
  loginStudent: (student_code: string, pin: string) =>
    request<AuthResponse>('/auth.php', {
      method: 'POST',
      body: { action: 'student', student_code, pin },
    }),

  loginGuest: (nickname: string, grade: number) =>
    request<AuthResponse>('/auth.php', {
      method: 'POST',
      body: { action: 'guest', nickname, grade },
    }),

  quizStart: (grade: number, scene: number | 'boss') =>
    request<QuizStartResponse>(`/quiz_start.php?grade=${grade}&scene=${scene}`),

  quizAnswer: (session_id: string, question_id: number, choice: 'a' | 'b' | 'c' | 'd', elapsed_ms: number) =>
    request<QuizAnswerResponse>('/quiz_answer.php', {
      method: 'POST',
      body: { session_id, question_id, choice, elapsed_ms },
    }),

  // QC only: ดึงเฉลยของ session (server gate ด้วย reviewer_player_id) — ปกติจะได้ 403
  quizReveal: (session_id: string) =>
    request<QuizRevealResponse>(`/quiz_reveal.php?session_id=${encodeURIComponent(session_id)}`),

  rewardCatalog: () => request<RewardCatalogResponse>('/reward_redeem.php'),

  rewardRedeem: (reward_id: number | string) =>
    request<RewardRedeemResponse>('/reward_redeem.php', {
      method: 'POST',
      body: { reward_id },
    }),
};
