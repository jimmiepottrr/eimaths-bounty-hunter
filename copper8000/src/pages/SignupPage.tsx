import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store';

const SignupPage = () => {
  const { signup } = useAuth();
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
      setError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
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
        <h2 style={{ marginTop: 0 }}>สมัครสำเร็จ</h2>
        <div className="success-box">
          บัญชีของคุณอยู่ระหว่าง<strong>รอการอนุมัติจากแอดมิน</strong> —
          เมื่อได้รับการอนุมัติแล้วจะสามารถจองราคาสินค้าได้ทันที
        </div>
        <p style={{ fontSize: 14 }}>
          ระหว่างนี้สามารถดู <Link to="/">ราคารับซื้อวันนี้</Link> หรือ{' '}
          <Link to="/products">รายการสินค้า</Link> ได้ตามปกติ
        </p>
      </div>
    );
  }

  return (
    <div className="card auth-card">
      <h2 style={{ marginTop: 0 }}>สมัครสมาชิก</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 0 }}>
        บัญชีใหม่ต้องผ่านการอนุมัติจากแอดมินก่อนจึงจะจองราคาได้
      </p>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">ชื่อ-นามสกุล / ชื่อบริษัท</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="phone">เบอร์โทรศัพท์</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
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
          <label htmlFor="password">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
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
          <label htmlFor="confirm">ยืนยันรหัสผ่าน</label>
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
          {busy ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
};

export default SignupPage;
