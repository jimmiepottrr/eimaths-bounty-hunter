import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isLoggedIn, logout } = useAppState();

  if (location.pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/home', label: 'แดชบอร์ด' },
    { to: '/quest', label: 'ภารกิจ' },
    { to: '/wallet', label: 'กระเป๋า' },
    { to: '/rewards', label: 'รางวัล' },
    { to: '/parent-report', label: 'รายงาน' },
  ];

  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => navigate('/home')}>
        <span className="brand-mark">E</span>
        <span className="brand-copy">
          <strong>Eimaths Bounty Hunter</strong>
          <span>{state.childName || 'นักล่าคณิต'} · {state.coins} coins</span>
        </span>
      </button>

      <nav className="topnav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {isLoggedIn && (
        <button className="ghost-button" type="button" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      )}
    </header>
  );
};

export default Header;
