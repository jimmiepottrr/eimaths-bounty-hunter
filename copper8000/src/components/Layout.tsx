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

  // ธีมของเว็บ (แอดมินตั้ง) — sync จาก backend ครั้งเดียวตอนเปิดแอป
  useEffect(() => {
    syncThemeFromServer();
  }, []);

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
                <div className="userbox">
                  <span className="name">{user.name}</span>
                  <span className={`status ${user.approved ? 'status-approved' : 'status-waiting'}`}>
                    {user.role === 'admin'
                      ? t('auth.adminRole')
                      : user.approved
                        ? t('auth.approved')
                        : t('auth.waiting')}
                  </span>
                </div>
                <button type="button" className="btn btn-outline btn-small" onClick={logout}>
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
          </div>
        </div>
        <div className="tabs-band">
          <nav className="tabs">
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
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={tabClass}>
              {t('nav.admin')}
              {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
            </NavLink>
          )}
          </nav>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">{t('layout.footer', { year: new Date().getFullYear() })}</footer>
    </>
  );
};

export default Layout;
