import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, QuizAnswerResponse, QuizStartResponse } from '../api';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader } from '../ui';
import { getWorld, sceneArtSlug, bossArtSlug } from '../world';
import { artUrl } from '../config';
import { playCorrect, playMusic, playSfx, stopMusic } from '../audio';

/**
 * Quiz เฟส 2 — โจทย์/คะแนน/คอมโบ/เหรียญมาจากเซิร์ฟเวอร์ทั้งหมด
 * client มีหน้าที่: จับเวลา (ส่ง elapsed_ms จริง) · แสดงผลตาม response · กัน double-submit
 * โหมดบอส: HP 10 ช่อง / หัวใจ 3 ดวง / แพ้ → เริ่มใหม่ด้วยชุดโจทย์สลับใหม่
 */

type Phase = 'loading' | 'error' | 'question' | 'feedback' | 'finished';

const CHOICE_KEYS = ['a', 'b', 'c', 'd'] as const;
type ChoiceKey = (typeof CHOICE_KEYS)[number];

const REPORT_KEY = 'bh2-reported-questions';
const QC_KEY = 'bh2-qc';

/**
 * โหมดตรวจ (QC) — เปิดด้วย ?qc=1 บน URL, ปิดด้วย ?qc=0
 * เก็บใน sessionStorage เพื่อให้อยู่ข้ามหน้า (login→map→quiz) จนกว่าจะปิดแท็บ
 * หมายเหตุ: นี่เป็นแค่ "สวิตช์ฝั่ง client ว่าจะขอเฉลยไหม" — การอนุญาตจริงอยู่ที่เซิร์ฟเวอร์
 * (quiz_reveal.php ตอบเฉลยเฉพาะบัญชีผู้ตรวจ) เด็กเปิด ?qc=1 เองก็ได้ 403 ไม่มีเฉลย
 */
const isQcMode = (): boolean => {
  try {
    const flag = new URLSearchParams(window.location.search).get('qc');
    if (flag === '1') window.sessionStorage.setItem(QC_KEY, '1');
    if (flag === '0') window.sessionStorage.removeItem(QC_KEY);
    return window.sessionStorage.getItem(QC_KEY) === '1';
  } catch {
    return false;
  }
};

const speedTierLabel = (tier: string) => {
  if (tier === 'fast') return '⚡ สายฟ้าแลบ!';
  if (tier === 'normal') return '🏃 ทันใจ';
  return '🚶 ทันเวลา';
};

const reportQuestion = (qid: number) => {
  try {
    const list: number[] = JSON.parse(window.localStorage.getItem(REPORT_KEY) ?? '[]');
    if (!list.includes(qid)) {
      list.push(qid);
      window.localStorage.setItem(REPORT_KEY, JSON.stringify(list));
    }
    // เฟส 4 ค่อยส่งเข้าระบบ — ตอนนี้เก็บ local + log ไว้ก่อน (ตาม brief ข้อ 7)
    console.log('[report-question]', qid);
  } catch {
    console.log('[report-question]', qid);
  }
};

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { scene = '1' } = useParams();
  const isBoss = scene === 'boss';
  const sceneNumber = isBoss ? 0 : Number(scene);

  const { player, playSound, markSceneCleared, markBossCleared } = useAppState();
  const grade = player?.grade ?? 3;
  const world = getWorld(grade);

  // อาร์ตพื้นหลังของฉาก/บอส (stylized 3D) — boss ใช้ art บอส, ฉากใช้ art ตามเลข scene
  const artSlug = isBoss ? bossArtSlug(grade) : sceneArtSlug(grade, sceneNumber);
  const bgArt = artSlug ? artUrl(artSlug) : undefined;

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [session, setSession] = useState<QuizStartResponse | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<ChoiceKey | null>(null);
  const [answer, setAnswer] = useState<QuizAnswerResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [reported, setReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revealAnswers, setRevealAnswers] = useState<Record<number, string>>({}); // QC only: qid → choice

  const questionShownAt = useRef(0);
  const submitLock = useRef(false); // กัน double-submit ระดับ ref (กันคลิกรัวก่อน state ทัน)

  const bossMaxHp = session?.boss?.hp ?? 10;
  const bossMaxHearts = session?.boss?.hearts ?? 3;
  const bossHp = answer?.session.boss_hp ?? bossMaxHp;
  const hearts = answer?.session.hearts ?? bossMaxHearts;
  const streak = answer?.session.streak ?? 0;

  const loadSession = useCallback(async () => {
    setPhase('loading');
    setErrorMessage('');
    setAnswer(null);
    setSelected(null);
    setQuestionIndex(0);
    setReported(false);
    submitLock.current = false;
    setSubmitting(false);
    try {
      const started = await api.quizStart(grade, isBoss ? 'boss' : sceneNumber);
      setSession(started);
      setSecondsLeft(started.time_limit_sec);
      questionShownAt.current = performance.now();
      setPhase('question');
      // โหมดตรวจ: ขอเฉลยจากเซิร์ฟเวอร์ (non-blocking) — ถ้าไม่ใช่ผู้ตรวจจะโดน 403 เงียบๆ ไม่มีไฮไลต์
      setRevealAnswers({});
      if (isQcMode()) {
        api
          .quizReveal(started.session_id)
          .then((rv) => {
            const map: Record<number, string> = {};
            for (const [qid, choice] of Object.entries(rv.answers)) map[Number(qid)] = String(choice);
            setRevealAnswers(map);
          })
          .catch(() => {
            /* ไม่ใช่บัญชีผู้ตรวจ หรือดึงไม่ได้ — ไม่ต้องทำอะไร */
          });
      }
    } catch (caught) {
      setErrorMessage(caught instanceof ApiError ? caught.message : 'โหลดโจทย์ไม่สำเร็จ ลองใหม่อีกครั้งนะ');
      setPhase('error');
    }
  }, [grade, isBoss, sceneNumber]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  // เฟส v2: ระหว่าง "ทำข้อสอบ" ต้องเงียบ ให้เด็กมีสมาธิ — หยุดเพลงที่ค้างมาจากแผนที่/บอส
  // (เพลงเล่นเฉพาะตอนไม่ได้ทำข้อสอบ: login / map / ช่วงเปลี่ยนด่าน-cutscene)
  useEffect(() => {
    stopMusic();
  }, []);

  // จบรอบ: ชนะ → เพลงฉลอง (เล่นครั้งเดียว) · แพ้บอส → หยุดเพลงให้เงียบลง
  useEffect(() => {
    if (phase !== 'finished' || !answer) return;
    const result = answer.finish?.result;
    if (result === 'win' || result === 'done') {
      playMusic('music-victory', { loop: false });
    } else if (isBoss) {
      stopMusic();
    }
  }, [phase, answer, isBoss]);

  // นาฬิกานับถอยหลังต่อข้อ — เดินเฉพาะตอนแสดงโจทย์
  useEffect(() => {
    if (phase !== 'question') return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, questionIndex]);

  const currentQuestion = session?.questions[questionIndex];
  const totalQuestions = session?.questions.length ?? 0;

  const submitAnswer = async (choice: ChoiceKey) => {
    if (!session || !currentQuestion) return;
    if (submitLock.current || phase !== 'question') return; // double-submit guard
    submitLock.current = true;
    setSubmitting(true);
    setSelected(choice);

    const elapsedMs = Math.round(performance.now() - questionShownAt.current);

    try {
      const result = await api.quizAnswer(session.session_id, currentQuestion.qid, choice, elapsedMs);
      setAnswer(result);
      // แสดงเฉลย/คะแนนของข้อนี้ก่อนเสมอ (รวมข้อสุดท้าย) — ค่อยกด "ดูสรุป" เข้าหน้าจบ
      setPhase('feedback');
      // SFX ไฟล์จริง: ตอบถูก 3 ระดับตามคอมโบ (เซิร์ฟเวอร์นับ) / ตอบผิดเสียงนุ่มไม่หลอนเด็ก
      if (result.correct) {
        playCorrect(result.session.streak); // 3 ระดับ + กลองคอมโบเมื่อถูก 3 ข้อติด
      } else {
        playSfx('wrong');
      }
    } catch (caught) {
      submitLock.current = false;
      setSelected(null);
      setErrorMessage(caught instanceof ApiError ? caught.message : 'ส่งคำตอบไม่สำเร็จ ลองใหม่อีกครั้งนะ');
      setPhase('error');
      return;
    }
    setSubmitting(false);
  };

  const goNextQuestion = () => {
    if (!session) return;
    setQuestionIndex((index) => index + 1);
    setSelected(null);
    setAnswer((current) => current); // คงค่า streak/hp ไว้แสดงระหว่างข้อ
    setReported(false);
    setSecondsLeft(session.time_limit_sec);
    questionShownAt.current = performance.now();
    submitLock.current = false;
    setPhase('question');
  };

  const finishScene = () => {
    if (isBoss) {
      markBossCleared(grade);
      navigate(`/cutscene/${world.boss.video}`);
    } else {
      markSceneCleared(grade, sceneNumber);
      navigate('/map');
    }
  };

  // ---------- Render helpers ----------

  const bossBar = isBoss && session?.boss && (
    <div className="boss-panel">
      <div className="boss-head">
        <span className="boss-avatar">😈</span>
        <div>
          <strong>{world.boss.name}</strong>
          <small>{world.boss.title}</small>
        </div>
      </div>
      <div className="boss-hp" aria-label={`พลังบอส ${bossHp}/${bossMaxHp}`}>
        {Array.from({ length: bossMaxHp }, (_, index) => (
          <span key={index} className={`hp-cell ${index < bossHp ? 'full' : 'hit'}`} />
        ))}
      </div>
      <div className="player-hearts" aria-label={`หัวใจ ${hearts}/${bossMaxHearts}`}>
        {Array.from({ length: bossMaxHearts }, (_, index) => (
          <span key={index}>{index < hearts ? '❤️' : '🖤'}</span>
        ))}
      </div>
    </div>
  );

  if (phase === 'loading') {
    return (
      <AppScreen bgArt={bgArt} className={`quiz-screen theme-${world.theme}`}>
        <div className="quiz-loading">
          <Mascot mood="focus" />
          <p>ปิ๊งกำลังเปิดแผนที่โจทย์… ⏳</p>
        </div>
      </AppScreen>
    );
  }

  if (phase === 'error') {
    return (
      <AppScreen bgArt={bgArt} className={`quiz-screen theme-${world.theme}`}>
        <div className="quiz-error">
          <Mascot mood="oops" />
          <h1>อุ๊ปส์!</h1>
          <p>{errorMessage}</p>
          <div className="result-actions">
            <button className="primary-button" type="button" onClick={() => void loadSession()}>
              ลองใหม่
            </button>
            <button className="outline-button" type="button" onClick={() => navigate('/map')}>
              กลับแผนที่
            </button>
          </div>
        </div>
      </AppScreen>
    );
  }

  if (phase === 'finished' && answer) {
    const finish = answer.finish;
    const won = finish?.result === 'win' || finish?.result === 'done';
    const bossLost = isBoss && !won;

    return (
      <AppScreen className={`result-screen theme-${world.theme}`}>
        <div className="celebration">
          <div className="stars">{won ? '⭐ ⭐ ⭐' : '💫'}</div>
          <Mascot mood={won ? 'wow' : 'oops'} />
          <h1>{bossLost ? 'พ่ายศึกนี้… แต่ยังไม่จบ!' : won ? (isBoss ? `ชนะ${world.boss.name}แล้ว!` : 'ผ่านฉากนี้แล้ว!') : 'จบรอบนี้แล้ว!'}</h1>
          <p>
            {bossLost
              ? 'หัวใจหมด! สู้ใหม่ด้วยชุดโจทย์สลับใหม่ — บอสจำเฉลยเดิมไม่ได้หรอก 😉'
              : won && isBoss
                ? 'ได้ชิ้นส่วนแผนที่มาครอง! ดูเนื้อเรื่องต่อเลย'
                : 'เก่งมาก! สะสมคะแนนต่อในฉากถัดไป'}
          </p>
        </div>

        <article className="earned-card">
          <h2>สรุปรอบนี้ (คิดโดยเซิร์ฟเวอร์)</h2>
          <div className="stat-strip flat">
            <span>
              🏆 คะแนน <b>{answer.session.score_total.toLocaleString()}</b>
            </span>
            <span>
              🪙 เหรียญ <b>+{answer.session.coins_total.toLocaleString()}</b>
            </span>
          </div>
          <div className="stat-strip flat">
            {typeof finish?.accuracy === 'number' && (
              <span>
                🎯 ความแม่น <b>{finish.accuracy}%</b>
              </span>
            )}
            {typeof finish?.bonus === 'number' && finish.bonus > 0 && (
              <span>
                🎁 โบนัส <b>+{finish.bonus}</b>
              </span>
            )}
          </div>
        </article>

        <div className="result-actions">
          {bossLost ? (
            <>
              <button className="primary-button" type="button" onClick={() => void loadSession()}>
                ⚔️ สู้ใหม่ (โจทย์ชุดใหม่)
              </button>
              <button className="outline-button" type="button" onClick={() => navigate('/map')}>
                กลับแผนที่
              </button>
            </>
          ) : (
            <button className="primary-button wide" type="button" onClick={finishScene}>
              {isBoss ? '🎬 ดูเนื้อเรื่องต่อ →' : 'กลับแผนที่ →'}
            </button>
          )}
        </div>
      </AppScreen>
    );
  }

  if (!currentQuestion || !session) {
    return null;
  }

  const sceneName = isBoss ? world.boss.name : world.scenes[sceneNumber - 1]?.name ?? '';
  const timerDanger = secondsLeft <= Math.ceil(session.time_limit_sec / 3);
  const qcMode = isQcMode();
  const qcAnswerKey = qcMode ? revealAnswers[currentQuestion.qid] : undefined;

  return (
    <AppScreen bgArt={bgArt} className={`quiz-screen theme-${world.theme} ${isBoss ? 'boss-mode' : ''}`}>
      {qcMode && <div className="qc-badge">🔑 โหมดตรวจ · เฉลย = ปุ่มเหลือง (สำหรับทดสอบเท่านั้น)</div>}
      <ScreenHeader
        title={`ข้อ ${questionIndex + 1}/${totalQuestions}`}
        subtitle={`${world.land} · ${sceneName}`}
        showBack
        right={
          <span className={`timer ${timerDanger ? 'danger' : ''}`} aria-label={`เหลือเวลา ${secondsLeft} วินาที`}>
            ⏱ {secondsLeft}s
          </span>
        }
      />
      <ProgressBar value={Math.round(((questionIndex + 1) / totalQuestions) * 100)} />

      {bossBar}

      <div className="quiz-coach">
        <Mascot compact mood={phase === 'feedback' && answer && !answer.correct ? 'oops' : 'focus'} />
        <p>
          {streak >= 2 && <span className="combo-flame">🔥 คอมโบ ×{streak} </span>}
          {phase === 'feedback' && answer
            ? answer.correct
              ? 'เยี่ยม! ลุยข้อต่อไปเลย!'
              : 'ไม่เป็นไร ดูเฉลยแล้วไปต่อ!'
            : secondsLeft === 0
              ? 'หมดเวลาโบนัส! ตอบได้อยู่แต่ไม่ได้ตัวคูณความเร็วนะ'
              : 'ตั้งใจอ่าน… ตอบเร็วได้โบนัสความเร็ว!'}
        </p>
      </div>

      <div className={`question-card ${phase === 'feedback' && answer ? (answer.correct ? 'correct' : 'wrong') : ''}`}>
        <div className="question-meta">
          <span className="difficulty-chip">ความยาก {'★'.repeat(Math.max(1, Math.min(5, currentQuestion.difficulty)))}</span>
          <button
            type="button"
            className="report-button"
            disabled={reported}
            onClick={() => {
              reportQuestion(currentQuestion.qid);
              setReported(true);
            }}
          >
            {reported ? '✓ แจ้งแล้ว' : '🚩 แจ้งข้อผิด'}
          </button>
        </div>

        <h1>{currentQuestion.text}</h1>

        <div className="answer-list">
          {CHOICE_KEYS.map((key) => {
            const isSelected = selected === key;
            const isCorrectChoice = phase === 'feedback' && answer?.correct_choice === key;
            const isWrongPick = phase === 'feedback' && isSelected && answer && !answer.correct;
            // QC เท่านั้น: ไฮไลต์เฉลยเป็นปุ่มเหลืองตอนโจทย์ยังไม่ถูกตอบ
            const isQcAnswer = phase === 'question' && qcAnswerKey === key;
            return (
              <button
                type="button"
                key={key}
                className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrectChoice ? 'reveal-correct' : ''} ${
                  isWrongPick ? 'reveal-wrong' : ''
                } ${isQcAnswer ? 'qc-answer' : ''}`}
                disabled={phase !== 'question' || submitting}
                onClick={() => void submitAnswer(key)}
              >
                <b>{key.toUpperCase()}</b>
                <span>{currentQuestion.choices[key]}</span>
                {isQcAnswer && <em className="qc-tag">เฉลย</em>}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && answer && (
          <div className={answer.correct ? 'correct-box' : 'wrong-box'}>
            <h2>
              {answer.correct
                ? `ถูกต้อง! +${answer.earned.score.toLocaleString()} คะแนน · ${speedTierLabel(answer.earned.speed_tier)}`
                : `เฉลยคือข้อ ${answer.correct_choice.toUpperCase()}`}
            </h2>
            {answer.explanation && <p>{answer.explanation}</p>}
            {answer.correct && (
              <p className="earned-line">
                🪙 +{answer.earned.coins.toLocaleString()} เหรียญ
                {answer.session.streak >= 2 && ` · 🔥 คอมโบ ×${answer.session.streak}`}
              </p>
            )}
            {isBoss && (
              <p className="earned-line">
                {answer.correct ? `✂️ ฟันดาบใส่บอส! เหลือ HP ${answer.session.boss_hp}/${bossMaxHp}` : `💔 โดนบอสสวน! หัวใจเหลือ ${answer.session.hearts}`}
              </p>
            )}
          </div>
        )}

        {currentQuestion.hint && phase === 'question' && (
          <details className="hint-box">
            <summary>💡 ขอคำใบ้จากปิ๊ง</summary>
            <p>{currentQuestion.hint}</p>
          </details>
        )}

        {phase === 'feedback' && answer && (
          <div className="quiz-actions">
            {answer.finished ? (
              <button
                className="primary-button wide"
                type="button"
                onClick={() => {
                  if (answer.finish?.result === 'win' || answer.finish?.result === 'done') {
                    playSound('reward');
                  }
                  setPhase('finished');
                }}
              >
                ดูสรุป →
              </button>
            ) : (
              <button className="primary-button wide" type="button" onClick={goNextQuestion}>
                ข้อต่อไป →
              </button>
            )}
          </div>
        )}
      </div>
    </AppScreen>
  );
};

export default Quiz;
