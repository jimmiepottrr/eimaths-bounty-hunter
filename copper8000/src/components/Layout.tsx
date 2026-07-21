import { Link, NavLink, Outlet } from 'react-router-dom';
import { IS_DEMO } from '../data/service';
import { useT } from '../i18n';
import { useAuth } from '../store';
import LanguagePicker from './LanguagePicker';
import Logo from './Logo';

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

const Layout = () => {
  const { user, logout } = useAuth();
  const t = useT();

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
            </NavLink>
          )}
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">{t('layout.footer', { year: new Date().getFullYear() })}</footer>
    </>
  );
};

export default Layout;
