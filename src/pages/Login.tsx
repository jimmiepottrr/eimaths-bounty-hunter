import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';
import { ApiError } from '../api';
import { AppScreen, Logo } from '../ui';
import { WORLDS } from '../world';
import { stopMusic } from '../audio';

type Mode = 'student' | 'guest';

const Login: React.FC = () => {
  // เข้าหน้า login = จบเซสชันเดิม → เงียบเพลงค้าง
  useEffect(() => {
    stopMusic(0);
  }, []);
  const navigate = useNavigate();
  const { loginStudent, loginGuest, authError } = useAppState();
  // โหมดตรวจ: รับ code + pin จาก URL (?code=QCP4xxx&pin=1234) มากรอกให้ล่วงหน้า — เหลือแค่กด "เข้าสู่ระบบ"
  const qparams = new URLSearchParams(window.location.search);
  const preCode = qparams.get('code') ?? '';
  const prePin = (qparams.get('pin') ?? '').replace(/\D/g, '').slice(0, 4);
  const [mode, setMode] = useState<Mode>('student');
  const [studentCode, setStudentCode] = useState(preCode);
  const [pin, setPin] = useState(prePin);
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState(3);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return; // กัน double-submit
    setBusy(true);
    setError('');
    try {
      if (mode === 'student') {
        await loginStudent(studentCode, pin);
      } else {
        await loginGuest(nickname, grade);
      }
      navigate('/intro');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'มีบางอย่างผิดพลาด ลองใหม่อีกครั้งนะ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen className="login-art">
      <div className="splash-panel">
        <Logo />
        <div className="island-scene">
          <div className="hero-caption">
            <strong>ตามล่าขุมทรัพย์แห่งปัญญา</strong>
            <span>ผจญภัย 4 ดินแดน พิสูจน์ตนด้วยปัญญา!</span>
          </div>
        </div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="speech-bubble">ปิ๊ง: "พร้อมออกล่าสมบัติหรือยัง? เข้าเกมกันเลย!"</div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'student'}
            className={mode === 'student' ? 'active' : ''}
            onClick={() => {
              setMode('student');
              setError('');
            }}
          >
            🎓 นักเรียน eiMaths
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'guest'}
            className={mode === 'guest' ? 'active' : ''}
            onClick={() => {
              setMode('guest');
              setError('');
            }}
          >
            ⚡ เล่นเลย (Guest)
          </button>
        </div>

        {mode === 'student' ? (
          <>
            <label>
              รหัสนักเรียน
              <input
                value={studentCode}
                onChange={(event) => setStudentCode(event.target.value)}
                placeholder="เช่น S045"
                autoComplete="username"
                required
              />
            </label>
            <label>
              PIN 4 หลัก
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                pattern="\d{4}"
                placeholder="••••"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          </>
        ) : (
          <>
            <label>
              ชื่อเล่นในเกม
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="เช่น นักล่าสายฟ้า"
                maxLength={20}
                required
              />
            </label>
            <div className="field-group" role="group" aria-label="ชั้นเรียน">
              <span className="field-label">ชั้นเรียน</span>
              <div className="grade-picker">
                {WORLDS.map((world) => (
                  <button
                    type="button"
                    key={world.grade}
                    className={`grade-chip ${grade === world.grade ? 'active' : ''}`}
                    aria-pressed={grade === world.grade}
                    onClick={() => setGrade(world.grade)}
                  >
                    {world.gradeLabel}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(error || authError) && (
          <div className="error-box" role="alert">
            <p>{error || authError}</p>
          </div>
        )}

        <button className="primary-button wide" type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าเกม…' : mode === 'student' ? 'เข้าสู่ระบบ →' : 'เริ่มผจญภัยเลย →'}
        </button>
        {mode === 'guest' && (
          <p className="guest-note">โหมด Guest เล่นได้ทุกด่าน · อยากขึ้นบอร์ดค่อยยืนยันตัวทีหลัง</p>
        )}
      </form>
    </AppScreen>
  );
};

export default Login;
