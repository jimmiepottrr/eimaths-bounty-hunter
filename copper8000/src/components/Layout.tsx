import { Link, NavLink, Outlet } from 'react-router-dom';
import { IS_DEMO } from '../data/service';
import { useAuth } from '../store';
import Logo from './Logo';

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </Link>
          {IS_DEMO && <span className="demo-badge">โหมดสาธิต</span>}
          <div className="topbar-auth">
            {user ? (
              <>
                <div className="userbox">
                  <span className="name">{user.name}</span>
                  <span className={`status ${user.approved ? 'status-approved' : 'status-waiting'}`}>
                    {user.role === 'admin'
                      ? 'ผู้ดูแลระบบ'
                      : user.approved
                        ? 'อนุมัติแล้ว — จองได้'
                        : 'รอการอนุมัติ'}
                  </span>
                </div>
                <button type="button" className="btn btn-outline btn-small" onClick={logout}>
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button type="button" className="btn btn-outline btn-small">
                    เข้าสู่ระบบ
                  </button>
                </Link>
                <Link to="/signup">
                  <button type="button" className="btn btn-primary btn-small">
                    สมัครสมาชิก
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="tabs">
          <NavLink to="/" end className={tabClass}>
            หน้าแรก
          </NavLink>
          <NavLink to="/products" className={tabClass}>
            สินค้า
          </NavLink>
          <NavLink to="/company" className={tabClass}>
            ข้อมูลบริษัท
          </NavLink>
          <NavLink to="/contact" className={tabClass}>
            ติดต่อบริษัท
          </NavLink>
          {user && (
            <NavLink to="/booking-report" className={tabClass}>
              การจองของฉัน
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={tabClass}>
              แอดมิน
            </NavLink>
          )}
        </nav>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} บริษัท คอปเปอร์ 8000 จำกัด — รับซื้อทองแดง ทองเหลือง อลูมิเนียม
      </footer>
    </>
  );
};

export default Layout;
