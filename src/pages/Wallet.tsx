import React from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen, Mascot, ScreenHeader, StatPill } from '../ui';
import { getWorld } from '../world';

const Wallet: React.FC = () => {
  const { player } = useAppState();
  const world = getWorld(player?.grade ?? 3);

  return (
    <AppScreen className="wallet-screen">
      <ScreenHeader title="กระเป๋าเหรียญ" subtitle="สะสมเหรียญไว้แลกของรางวัลที่สาขา" showBack />

      <div className="profile-card">
        <Mascot compact />
        <div>
          <h1>สวัสดี, {player?.nickname || 'นักล่า'}!</h1>
          <span>
            {world.gradeLabel} · {world.land}
          </span>
        </div>
      </div>

      <article className="coin-card">
        <span>เหรียญของฉัน</span>
        <strong>🪙 {(player?.coins ?? 0).toLocaleString()}</strong>
        <div className="wallet-stats">
          <StatPill
            icon="🎖️"
            label="สถานะ"
            value={player?.type === 'student' ? 'นร.eiMaths' : 'Guest'}
          />
          <StatPill icon="🧭" label="ดินแดน" value={world.land} />
        </div>
      </article>

      <article className="activity-card">
        <div className="section-title compact">
          <h2>เหรียญมาจากไหน?</h2>
        </div>
        <ul className="activity-list">
          <li>
            <span>ตอบถูกในแต่ละฉาก</span>
            <strong>เซิร์ฟเวอร์คิดให้</strong>
          </li>
          <li>
            <span>โบนัสความเร็ว ⚡ + คอมโบ 🔥</span>
            <strong>อัตโนมัติ</strong>
          </li>
          <li>
            <span>ชนะบอสประจำดินแดน</span>
            <strong>รางวัลใหญ่</strong>
          </li>
        </ul>
      </article>

      <Link className="primary-button wide" to="/rewards">
        ไปแลกของรางวัล →
      </Link>
    </AppScreen>
  );
};

export default Wallet;
