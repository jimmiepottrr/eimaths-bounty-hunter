import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IS_DEMO } from '../data/service';
import { useT } from '../i18n';
import { useAuth } from '../store';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      await login(email, password);
      navigate('/products');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2 style={{ marginTop: 0 }}>{t('auth.login')}</h2>
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
          {busy ? t('login.submitting') : t('auth.login')}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        {t('login.noAccount')} <Link to="/signup">{t('auth.signup')}</Link>
      </p>
      {IS_DEMO && (
        <div className="info-box">
          <strong>{t('login.demoTitle')}</strong>
          <br />
          {t('login.demoUser')}: demo@copper8000.co.th / demo1234
          <br />
          {t('login.demoAdmin')}: admin@copper8000.co.th / admin1234
        </div>
      )}
    </div>
  );
};

export default LoginPage;
