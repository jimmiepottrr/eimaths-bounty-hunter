import type { Page, Route } from '@playwright/test';

/**
 * Mock API ตาม contract เฟส 1 (COWORK-BRIEF ข้อ 2) — ใช้เมื่อไม่มีเซิร์ฟเวอร์จริงใน CI
 * กติกา mock: เฉลยอยู่ฝั่ง mock เท่านั้น (choice 'a' ถูกเสมอ) — payload ที่ส่งให้เกมไม่มีเฉลย
 */

type SessionState = {
  id: string;
  mode: 'normal' | 'boss';
  grade: number;
  scene: string;
  answered: number;
  correctCount: number;
  streak: number;
  scoreTotal: number;
  coinsTotal: number;
  bossHp: number;
  hearts: number;
  totalQuestions: number;
  finished: boolean;
};

export type MockStats = {
  authCalls: number;
  quizStartCalls: number;
  quizAnswerCalls: number;
  elapsedMsSamples: number[];
  apiKeySeen: string[];
  bearerSeen: string[];
};

const TIME_LIMITS: Record<number, number> = { 3: 60, 4: 45, 5: 40, 6: 30 };

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

export const installMockApi = async (page: Page): Promise<MockStats> => {
  const stats: MockStats = {
    authCalls: 0,
    quizStartCalls: 0,
    quizAnswerCalls: 0,
    elapsedMsSamples: [],
    apiKeySeen: [],
    bearerSeen: [],
  };

  const sessions = new Map<string, SessionState>();
  let sessionCounter = 0;
  let playerCounter = 0;
  let playerCoins = 0;

  const questionsFor = (state: SessionState) =>
    Array.from({ length: state.totalQuestions }, (_, index) => ({
      no: index + 1,
      qid: 1000 * state.grade + index + 1,
      difficulty: Math.min(5, 1 + Math.floor(index / 2)),
      text: `[${state.scene}] ข้อ ${index + 1}: ${index + 2} + ${index + 3} = ?`,
      choices: {
        a: String(index + 2 + index + 3), // เฉลยจริง (mock ฝั่งเซิร์ฟเวอร์เท่านั้น)
        b: String(index + 1),
        c: String(index + 9),
        d: String(index + 12),
      },
      hint: 'ลองนับทีละก้าวดูนะ',
    }));

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    stats.apiKeySeen.push(request.headers()['x-api-key'] ?? '');
    const bearer = request.headers()['authorization'] ?? '';
    if (bearer) stats.bearerSeen.push(bearer);

    // ---------- /auth.php ----------
    if (path.endsWith('/auth.php')) {
      stats.authCalls += 1;
      const body = request.postDataJSON() as Record<string, unknown>;

      if (body.action === 'student') {
        if (body.student_code === 'TEST01' && body.pin === '4726') {
          playerCounter += 1;
          return json(route, {
            ok: true,
            token: `tok-student-${playerCounter}`,
            player: {
              id: playerCounter,
              type: 'student',
              nickname: 'นักล่าทดสอบ',
              grade: 3,
              coins: playerCoins,
              line_verified: true,
              items: [],
            },
          });
        }
        return json(route, { ok: false, error: 'รหัสนักเรียนหรือ PIN ไม่ถูกต้อง' }, 401);
      }

      if (body.action === 'guest') {
        playerCounter += 1;
        return json(route, {
          ok: true,
          token: `tok-guest-${playerCounter}`,
          player: {
            id: playerCounter,
            type: 'guest',
            nickname: body.nickname,
            grade: body.grade,
            coins: 0,
            line_verified: false,
            items: [],
          },
        });
      }

      return json(route, { ok: false, error: 'action ไม่ถูกต้อง' }, 400);
    }

    // ---------- /quiz_start.php ----------
    if (path.endsWith('/quiz_start.php')) {
      stats.quizStartCalls += 1;
      if (!bearer.startsWith('Bearer tok-')) {
        return json(route, { ok: false, error: 'เซสชันหมดอายุ' }, 401);
      }
      const grade = Number(url.searchParams.get('grade'));
      const scene = url.searchParams.get('scene') ?? '1';
      const isBoss = scene === 'boss';
      sessionCounter += 1;

      const state: SessionState = {
        id: `sess-${sessionCounter}`,
        mode: isBoss ? 'boss' : 'normal',
        grade,
        scene,
        answered: 0,
        correctCount: 0,
        streak: 0,
        scoreTotal: 0,
        coinsTotal: 0,
        bossHp: 10,
        hearts: 3,
        totalQuestions: isBoss ? 13 : 10,
        finished: false,
      };
      sessions.set(state.id, state);

      return json(route, {
        ok: true,
        session_id: state.id,
        mode: state.mode,
        time_limit_sec: TIME_LIMITS[grade] ?? 60,
        ...(isBoss ? { boss: { hp: 10, hearts: 3 } } : {}),
        questions: questionsFor(state),
      });
    }

    // ---------- /quiz_answer.php ----------
    if (path.endsWith('/quiz_answer.php')) {
      stats.quizAnswerCalls += 1;
      if (!bearer.startsWith('Bearer tok-')) {
        return json(route, { ok: false, error: 'เซสชันหมดอายุ' }, 401);
      }
      const body = request.postDataJSON() as {
        session_id: string;
        question_id: number;
        choice: 'a' | 'b' | 'c' | 'd';
        elapsed_ms: number;
      };
      stats.elapsedMsSamples.push(body.elapsed_ms);

      const state = sessions.get(body.session_id);
      if (!state || state.finished) {
        return json(route, { ok: false, error: 'เซสชันไม่ถูกต้องหรือจบไปแล้ว' }, 400);
      }

      const correct = body.choice === 'a';
      state.answered += 1;

      if (correct) {
        state.correctCount += 1;
        state.streak += 1;
        const earnedScore = 100 + state.streak * 5;
        state.scoreTotal += earnedScore;
        state.coinsTotal += Math.round(earnedScore / 10);
        if (state.mode === 'boss') state.bossHp = Math.max(0, state.bossHp - 1);
      } else {
        state.streak = 0;
        if (state.mode === 'boss') state.hearts = Math.max(0, state.hearts - 1);
      }

      let finished = false;
      let finish: Record<string, unknown> | undefined;

      if (state.mode === 'boss') {
        if (state.bossHp === 0) {
          finished = true;
          finish = { result: 'win', bonus: 500, accuracy: Math.round((state.correctCount / state.answered) * 100) };
        } else if (state.hearts === 0 || state.answered >= state.totalQuestions) {
          finished = true;
          finish = { result: 'lose', bonus: 0, accuracy: Math.round((state.correctCount / state.answered) * 100) };
        }
      } else if (state.answered >= state.totalQuestions) {
        finished = true;
        finish = {
          result: 'done',
          bonus: state.correctCount === state.totalQuestions ? 200 : 0,
          accuracy: Math.round((state.correctCount / state.answered) * 100),
        };
      }

      state.finished = finished;
      if (finished) playerCoins += state.coinsTotal;

      const earnedScore = correct ? 100 + state.streak * 5 : 0;
      return json(route, {
        ok: true,
        correct,
        correct_choice: 'a',
        explanation: correct ? 'เก่งมาก! วิธีคิดถูกต้องเป๊ะ' : 'บวกทีละหลักอย่างระวังนะ แล้วลองใหม่ข้อหน้า',
        earned: {
          score: earnedScore,
          coins: Math.round(earnedScore / 10),
          speed_tier: body.elapsed_ms < 5000 ? 'fast' : body.elapsed_ms < 15000 ? 'normal' : 'slow',
          multipliers: { speed: 1.2, phase: 1.3, combo: 1 + state.streak * 0.05 },
        },
        session: {
          streak: state.streak,
          score_total: state.scoreTotal,
          coins_total: state.coinsTotal,
          ...(state.mode === 'boss' ? { boss_hp: state.bossHp, hearts: state.hearts } : {}),
          ...(finished ? { result: finish?.result } : {}),
        },
        finished,
        ...(finished ? { finish } : {}),
      });
    }

    // ---------- /reward_redeem.php ----------
    if (path.endsWith('/reward_redeem.php')) {
      if (request.method() === 'GET') {
        return json(route, {
          ok: true,
          rewards: [
            { id: 1, name: 'คูปองส่วนลด ฿100', cost: 500, icon: '🎟️', description: 'ส่วนลดคอร์ส eiMaths' },
            { id: 2, name: 'คูปองส่วนลด ฿250', cost: 1200, icon: '🎫', description: 'สำหรับนักล่าสายสะสม' },
          ],
        });
      }
      return json(route, { ok: true, message: 'แลกสำเร็จ!', coins: Math.max(0, playerCoins - 500) });
    }

    return json(route, { ok: false, error: 'ไม่พบ endpoint' }, 404);
  });

  return stats;
};
