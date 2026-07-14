import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader, StatPill } from '../ui';
import { getWorld, lastSceneOf } from '../world';
import { stopMusic } from '../audio';

const Home: React.FC = () => {
  const { player, progressFor } = useAppState();

  // หน้าหลักเป็นพื้นที่พัก — ค่อยเริ่มเพลงอีกทีตอนเข้าแผนที่
  useEffect(() => {
    stopMusic();
  }, []);
  const grade = player?.grade ?? 3;
  const world = getWorld(grade);
  const progress = progressFor(grade);
  const totalNodes = world.scenes.length + 1;
  const clearedNodes = progress.clearedScenes + (progress.bossCleared ? 1 : 0);
  const bossUnlocked = progress.clearedScenes >= lastSceneOf(world);

  return (
    <AppScreen className={`home-screen theme-${world.theme}`}>
      <div className="blue-hero">
        <ScreenHeader
          title={`สวัสดี, ${player?.nickname || 'นักล่า'}!`}
          subtitle={`นักล่าสมบัติ ${world.gradeLabel} · ${world.land}`}
          right={<span className="bell">🦉</span>}
        />
        <div className="stat-strip">
          <StatPill icon="🪙" label="เหรียญ" value={(player?.coins ?? 0).toLocaleString()} />
          <StatPill icon="🗺️" label="ฉากที่ผ่าน" value={`${clearedNodes}/${totalNodes}`} />
          <StatPill icon="🎖️" label="สถานะ" value={player?.type === 'student' ? 'นร.eiMaths' : 'Guest'} />
        </div>
      </div>

      <article className="daily-card">
        <div>
          <span className="scroll-icon">🗺️</span>
          <h2>{world.emoji} {world.land}</h2>
          <p>
            {progress.bossCleared
              ? 'พิชิตดินแดนนี้แล้ว! เก็บคะแนน/เหรียญเพิ่มได้ทุกฉาก'
              : bossUnlocked
                ? `ถึงเวลาท้าดวล ${world.boss.name}!`
                : `ฉากต่อไป: ${world.scenes[progress.clearedScenes]?.name ?? '-'}`}
          </p>
          <ProgressBar value={(clearedNodes / totalNodes) * 100} tone="gold" />
          <small>
            {clearedNodes}/{totalNodes} · เวลา {world.timeLimitSec} วิ/ข้อ
          </small>
        </div>
        <strong>{world.emoji}</strong>
      </article>

      <div className="coach-card">
        <Mascot compact />
        <p>ปิ๊ง: "ตอบถูกได้คะแนนเต็มเสมอ ตอบไวได้โบนัสความเร็วเพิ่ม! ⚡"</p>
      </div>

      <div className="action-grid">
        <Link to="/map">🗺️<span>แผนที่</span></Link>
        <Link to={bossUnlocked ? '/quiz/boss' : '/map'}>⚔️<span>บอส</span></Link>
        <Link to="/rewards">🎁<span>ของรางวัล</span></Link>
        <Link to="/wallet">🪙<span>กระเป๋า</span></Link>
        <Link to="/parent-report">👤<span>โปรไฟล์</span></Link>
      </div>
    </AppScreen>
  );
};

export default Home;
