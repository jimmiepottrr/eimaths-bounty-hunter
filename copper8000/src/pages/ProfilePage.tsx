/**
 * ข้อมูลผู้ใช้ — ดูข้อมูลได้อย่างเดียว (แก้ไขต้องติดต่อบริษัท) + เปลี่ยนรหัสผ่านได้
 */

import { useEffect, useState, type FormEvent } from 'react';
import { dataService } from '../data/service';
import { fmtBaht } from '../format';
import { useT } from '../i18n';
import { useAuth } from '../store';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const t = useT();

  // ดึงข้อมูลล่าสุด (เครดิต/ใบเตือน อาจเปลี่ยนหลังจอง/แอดมินปรับ) ตอนเปิดหน้า
  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null; // RequireAuth ครอบไว้แล้ว

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (next.length < 6) {
      setError(t('signup.errPwLen'));
      return;
    }
    if (next !== confirm) {
      setError(t('signup.errPwMismatch'));
      return;
    }
    setBusy(true);
    try {
      await dataService.changePassword(current, next);
      setSaved(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2 style={{ marginTop: 0 }}>{t('nav.profile')}</h2>

      <ul className="contact-list" style={{ marginBottom: 14 }}>
        <li>
          <span className="k">{t('admin.colName')}</span>
          <span>{user.name}</span>
        </li>
        <li>
          <span className="k">{t('login.email')}</span>
          <span>{user.email}</span>
        </li>
        <li>
          <span className="k">{t('admin.colPhone')}</span>
          <span>{user.phone || '—'}</span>
        </li>
        <li>
          <span className="k">{t('report.colStatus')}</span>
          <span>
            {user.role === 'admin' ? (
              t('auth.adminRole')
            ) : user.role === 'agent' ? (
              t('auth.agentRole')
            ) : user.approved ? (
              <span className="badge badge-confirmed">{t('auth.approved')}</span>
            ) : (
              <span className="badge badge-pending">{t('auth.waiting')}</span>
            )}
          </span>
        </li>
      </ul>

      {user.role === 'user' && (
        <>
          {user.booking_suspended && (
            <div className="error-box" style={{ marginBottom: 14 }}>
              {t('profile.suspendedNote')}
            </div>
          )}
          <ul className="contact-list" style={{ marginBottom: 14 }}>
            <li>
              <span className="k">{t('profile.creditBalance')}</span>
              <span>{fmtBaht(user.credit_balance ?? 0)}</span>
            </li>
            {(user.credit_held ?? 0) > 0 && (
              <li>
                <span className="k">{t('profile.creditHeld')}</span>
                <span>{fmtBaht(user.credit_held ?? 0)}</span>
              </li>
            )}
            {(user.warnings ?? 0) > 0 && !user.booking_suspended && (
              <li>
                <span className="k">{t('profile.warnings')}</span>
                <span>
                  <span className="badge badge-pending">{t('adminCredit.warnCount', { n: user.warnings ?? 0 })}</span>
                </span>
              </li>
            )}
          </ul>
        </>
      )}

      <div className="info-box" style={{ marginBottom: 22 }}>
        {t('profile.readonlyNote')}
      </div>

      <h3>{t('profile.changePw')}</h3>
      {error && <div className="error-box">{error}</div>}
      {saved && <div className="success-box" style={{ marginBottom: 14 }}>✓ {t('profile.saved')}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="pw-current">{t('profile.currentPw')}</label>
          <input
            id="pw-current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label htmlFor="pw-new">{t('profile.newPw')}</label>
          <input
            id="pw-new"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="pw-confirm">{t('profile.confirmNewPw')}</label>
          <input
            id="pw-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
          {busy ? t('adminLang.saving') : t('profile.changePw')}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
