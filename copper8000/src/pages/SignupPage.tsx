import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { useAuth } from '../store';

const SignupPage = () => {
  const { signup } = useAuth();
  const t = useT();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t('signup.errPwLen'));
      return;
    }
    if (password !== confirm) {
      setError(t('signup.errPwMismatch'));
      return;
    }
    setBusy(true);
    try {
      await signup({ email, password, name, phone });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card auth-card">
        <h2 style={{ marginTop: 0 }}>{t('signup.successTitle')}</h2>
        <div className="success-box">{t('signup.successBody')}</div>
        <p style={{ fontSize: 14 }}>
          {t('signup.browseNote')} <Link to="/">{t('nav.home')}</Link> ·{' '}
          <Link to="/products">{t('nav.products')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2 style={{ marginTop: 0 }}>{t('auth.signup')}</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 0 }}>{t('signup.note')}</p>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{t('signup.name')}</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="phone">{t('signup.phone')}</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
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
          <label htmlFor="password">{t('signup.password6')}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">{t('signup.confirmPw')}</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
          {busy ? t('signup.submitting') : t('auth.signup')}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        {t('signup.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </div>
  );
};

export default SignupPage;
