import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IS_DEMO } from '../data/service';
import { useAuth } from '../store';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      <h2 style={{ marginTop: 0 }}>เข้าสู่ระบบ</h2>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">อีเมล</label>
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
          <label htmlFor="password">รหัสผ่าน</label>
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
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        ยังไม่มีบัญชี? <Link to="/signup">สมัครสมาชิก</Link>
      </p>
      {IS_DEMO && (
        <div className="info-box">
          <strong>บัญชีทดลอง (โหมดสาธิต):</strong>
          <br />
          ผู้ใช้: demo@copper8000.co.th / demo1234
          <br />
          แอดมิน: admin@copper8000.co.th / admin1234
        </div>
      )}
    </div>
  );
};

export default LoginPage;
