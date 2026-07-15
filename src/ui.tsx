import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export const Mascot: React.FC<{
  mood?: 'happy' | 'focus' | 'wow' | 'oops';
  compact?: boolean;
  variant?: 'portrait' | 'journey';
}> = ({
  mood = 'happy',
  compact = false,
  variant = 'portrait',
}) => (
  <div
    className={`mascot mascot-${mood} mascot-${variant} ${compact ? 'compact' : ''}`}
    role="img"
    aria-label={`Eimaths lion mascot, ${mood}`}
  >
    <img
      src={`${import.meta.env.BASE_URL}assets/${variant === 'journey' ? 'eimaths-journey-3d.webp' : 'eimaths-hero-3d.webp'}`}
      alt=""
    />
  </div>
);

export const Logo: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`game-logo ${small ? 'small' : ''}`}>
    <span>Eimaths</span>
    <strong>Bounty</strong>
    <b>Hunter</b>
  </div>
);

export const PhoneFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`phone-frame ${className}`}>
    <div className="phone-notch" />
    <div className="phone-status">
      <span>9:41</span>
      <span>●●● ▰</span>
    </div>
    {children}
  </div>
);

export const StatPill: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="stat-pill">
    <span>{icon}</span>
    <small>{label}</small>
    <strong>{value}</strong>
  </div>
);

export const ProgressBar: React.FC<{ value: number; tone?: 'blue' | 'gold' | 'green' | 'orange' }> = ({
  value,
  tone = 'blue',
}) => (
  <div className={`progress-track ${tone}`} aria-label={`Progress ${value}%`}>
    <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}> = ({ title, subtitle, showBack = false, right }) => (
  <div className="screen-header">
    {showBack ? (
      <Link className="icon-button" to="/home" aria-label="Back">
        ←
      </Link>
    ) : (
      <Mascot compact />
    )}
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    <div className="screen-header-right">{right}</div>
  </div>
);

export const BottomNav: React.FC = () => {
  const items = [
    { to: '/home', label: 'หน้าหลัก', icon: '🏠' },
    { to: '/map', label: 'แผนที่', icon: '🗺️' },
    { to: '/rewards', label: 'รางวัล', icon: '🎁' },
    { to: '/wallet', label: 'กระเป๋า', icon: '🪙' },
    { to: '/parent-report', label: 'โปรไฟล์', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </NavLink>
      ))}
    </nav>
  );
};

export const AppScreen: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** slug อาร์ตพื้นหลัง (stylized 3D) — ถ้ามีจะวาดเป็นเลเยอร์พื้นหลังใต้เนื้อหา */
  bgArt?: string;
}> = ({ children, className = '', bgArt }) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <section className={`app-screen ${className} ${bgArt ? 'has-scene-bg' : ''}`}>
      <PhoneFrame>
        {bgArt && (
          <div
            className="scene-bg"
            aria-hidden="true"
            style={{ backgroundImage: `url(${bgArt})` }}
          />
        )}
        {children}
        {!isLogin && <BottomNav />}
      </PhoneFrame>
    </section>
  );
};
