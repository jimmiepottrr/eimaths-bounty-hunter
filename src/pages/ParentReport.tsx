import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen, Mascot, ScreenHeader, StatPill } from '../ui';
import { getWorld } from '../world';

/**
 * โปรไฟล์ผู้เล่น — Dashboard ผู้ปกครองเต็มรูปแบบเป็นงานเฟส 4 (นอก scope เฟสนี้)
 */
const ParentReport: React.FC = () => {
  const navigate = useNavigate();
  const { player, logout, soundEnabled, toggleSound, progressFor } = useAppState();
  const grade = player?.grade ?? 3;
  const world = getWorld(grade);
  const progress = progressFor(grade);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppScreen className="profile-screen">
      <ScreenHeader title="โปรไฟล์" subtitle="ข้อมูลนักล่าสมบัติ" showBack />

      <div className="profile-card">
        <Mascot compact />
        <div>
          <h1>{player?.nickname || 'นักล่า'}</h1>
          <span>
            {world.gradeLabel} · {player?.type === 'student' ? 'นักเรียน eiMaths' : 'Guest'}
          </span>
        </div>
      </div>

      <div className="stat-strip">
        <StatPill icon="🪙" label="เหรียญ" value={(player?.coins ?? 0).toLocaleString()} />
        <StatPill icon="🗺️" label="ฉากที่ผ่าน" value={progress.clearedScenes} />
        <StatPill icon="⚔️" label="บอส" value={progress.bossCleared ? 'ชนะแล้ว' : 'ยังไม่ชนะ'} />
      </div>

      <article className="activity-card">
        <div className="section-title compact">
          <h2>ตั้งค่า</h2>
        </div>
        <ul className="activity-list">
          <li>
            <span>เสียงเอฟเฟกต์</span>
            <button className="outline-button" type="button" onClick={toggleSound}>
              {soundEnabled ? '🔊 เปิดอยู่' : '🔇 ปิดอยู่'}
            </button>
          </li>
        </ul>
        <p className="settings-note">
          📊 Dashboard ผู้ปกครองแบบเต็ม (กราฟพัฒนาการ) กำลังมาในเฟสถัดไป
        </p>
      </article>

      <button className="outline-button wide" type="button" onClick={handleLogout}>
        ออกจากระบบ
      </button>
    </AppScreen>
  );
};

export default ParentReport;
