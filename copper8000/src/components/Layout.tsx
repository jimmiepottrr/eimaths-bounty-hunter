import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { dataService, IS_DEMO } from '../data/service';
import { useT } from '../i18n';
import { useAuth } from '../store';
import { syncThemeFromServer } from '../themeManager';
import LanguagePicker from './LanguagePicker';
import Logo from './Logo';

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

const Layout = () => {
  const { user, logout } = useAuth();
  const t = useT();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // ธีมของเว็บ (แอดมินตั้ง) — sync จาก backend ครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    syncThemeFromServer();
  }, []);

  // เปลี่ยนหน้าแล้วปิดเมนูมือถืออัตโนมัติ
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // badge บนแท็บ "แอดมิน": จำนวนเรื่องที่รอ approve (สมาชิกใหม่ + การจองใหม่)
  useEffect(() => {
    if (user?.role !== 'admin') {
      setPendingCount(0);
      return;
    }
    let cancelled = false;
    Promise.all([dataService.listPendingUsers(), dataService.listAllBookings()])
      .then(([users, bookings]) => {
        if (!cancelled) {
          setPendingCount(users.length + bookings.filter((b) => b.status === 'pending').length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  const navLinks = (
    <>
      <NavLink to="/" end className={tabClass}>
        {t('nav.home')}
      </NavLink>
      <NavLink to="/products" className={tabClass}>
        {t('nav.products')}
      </NavLink>
      <NavLink to="/company" className={tabClass}>
        {t('nav.company')}
      </NavLink>
      <NavLink to="/contact" className={tabClass}>
        {t('nav.contact')}
      </NavLink>
      {user && (
        <NavLink to="/booking-report" className={tabClass}>
          {t('nav.myBookings')}
        </NavLink>
      )}
      {user && (
        <NavLink to="/profile" className={tabClass}>
          {t('nav.profile')}
        </NavLink>
      )}
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={tabClass}>
          {t('nav.admin')}
          {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
          {IS_DEMO && <span className="demo-badge">{t('auth.demoBadge')}</span>}
          <div className="topbar-auth">
            <LanguagePicker />
            {user ? (
              <>
                <Link to="/profile" className="userbox" title={t('nav.profile')}>
                  <span className="name">{user.name}</span>
                  <span className={`status ${user.approved ? 'status-approved' : 'status-waiting'}`}>
                    {user.role === 'admin'
                      ? t('auth.adminRole')
                      : user.role === 'agent'
                        ? t('auth.agentRole')
                        : user.approved
                          ? t('auth.approved')
                          : t('auth.waiting')}
                  </span>
                </Link>
                <button type="button" className="btn btn-outline btn-small logout-btn" onClick={logout}>
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button type="button" className="btn btn-outline btn-small">
                    {t('auth.login')}
                  </button>
                </Link>
                <Link to="/signup">
                  <button type="button" className="btn btn-primary btn-small">
                    {t('auth.signup')}
                  </button>
                </Link>
              </>
            )}
            <button
              type="button"
              className="hamburger"
              aria-label={t('nav.home')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        <div className="tabs-band">
          <nav className="tabs">{navLinks}</nav>
        </div>
        {menuOpen && <nav className="mobile-menu">{navLinks}</nav>}
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">{t('layout.footer', { year: new Date().getFullYear() })}</footer>
    </>
  );
};

export default Layout;
