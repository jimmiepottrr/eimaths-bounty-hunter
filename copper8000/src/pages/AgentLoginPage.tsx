import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IS_DEMO } from '../data/service';
import { useT } from '../i18n';
import { useAuth } from '../store';

/** หน้าเข้าสู่ระบบสำหรับพนักงาน (agent) แยกต่างหาก — คนที่ไม่ใช่พนักงาน/แอดมินจะถูกปฏิเสธ */
const AgentLoginPage = () => {
  const navigate = useNavigate();
  const { login, clearSession } = useAuth();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.role !== 'agent' && user.role !== 'admin') {
        // ล็อกอินสำเร็จแต่ไม่ใช่พนักงาน — เคลียร์เซสชันแล้วแจ้งเตือน (ไม่พาเข้าระบบ)
        clearSession();
        setError(t('agentLogin.notStaff'));
        return;
      }
      navigate('/products');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2 style={{ marginTop: 0 }}>{t('agentLogin.title')}</h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 0 }}>{t('agentLogin.subtitle')}</p>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">{t('login.email')}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
          {busy ? t('login.submitting') : t('agentLogin.submit')}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        <Link to="/login">{t('agentLogin.backToUser')}</Link>
      </p>
      {IS_DEMO && (
        <div className="info-box">
          <strong>{t('login.demoTitle')}</strong>
          <br />
          {t('auth.agentRole')}: agent@copper8000.co.th / agent1234
        </div>
      )}
    </div>
  );
};

export default AgentLoginPage;
