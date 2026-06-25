import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Simple header component providing top navigation. Shows links
// appropriate for the current location. When the user is on
// login page the header is hidden. In a real app this could
// include user profile, settings, etc.
const Header: React.FC = () => {
  const location = useLocation();
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/home">หน้าหลัก</Link>
        <Link to="/quest">ภารกิจ</Link>
        <Link to="/quiz">แบบทดสอบ</Link>
        <Link to="/wallet">กระเป๋าเหรียญ</Link>
        <Link to="/rewards">ของรางวัล</Link>
        <Link to="/parent-report">รายงานผู้ปกครอง</Link>
      </nav>
    </header>
  );
};

export default Header;