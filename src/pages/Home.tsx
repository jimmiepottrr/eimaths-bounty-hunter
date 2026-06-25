import React from 'react';
import { Link } from 'react-router-dom';

// Home page acts as the main dashboard. It provides navigation to
// quests, quizzes, rewards and wallet. This is the landing page
// after selecting a grade.
const Home: React.FC = () => {
  return (
    <div>
      <h1>หน้าหลัก</h1>
      <p>ยินดีต้อนรับสู่ Eimaths Bounty Hunter!</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link to="/quest">เข้าเล่นภารกิจ</Link>
        <Link to="/quiz">ทำแบบทดสอบ</Link>
        <Link to="/wallet">กระเป๋าเหรียญ</Link>
        <Link to="/rewards">ของรางวัล</Link>
        <Link to="/parent-report">รายงานผู้ปกครอง</Link>
      </nav>
    </div>
  );
};

export default Home;