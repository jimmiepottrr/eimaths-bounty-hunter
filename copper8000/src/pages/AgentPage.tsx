/** หน้าพนักงานขาย (agent) — ดูค่าคอมของตัวเอง (สะสม + รายเดือนย้อนหลัง) + รายชื่อลูกค้าที่ผูกกับโค้ดแนะนำ
 *  % ค่าคอมล็อกฝั่งเซิร์ฟเวอร์ตั้งแต่ตอนจอง (กันปลอมแปลง/ไม่เปลี่ยนย้อนหลัง) — หน้านี้แสดงผลอย่างเดียว */

import { useEffect, useState } from 'react';
import { dataService } from '../data/service';
import type { AgentCommission, AgentMember } from '../data/types';
import { fmtBaht, fmtMonth, fmtNumber } from '../format';
import { useI18n } from '../i18n';

const AgentPage = () => {
  const { t } = useI18n();
  const [summary, setSummary] = useState<AgentCommission | null>(null);
  const [members, setMembers] = useState<AgentMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataService
      .agentCommission()
      .then(setSummary)
      .catch((e) => setError((e as Error).message));
    dataService
      .agentMembers()
      .then(setMembers)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <>
      <div className="section-heading">
        <h2>{t('agent.heading')}</h2>
        <span className="en">Agent Console</span>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!summary && !error ? (
        <div className="empty-state">{t('admin.loading')}</div>
      ) : summary ? (
        <>
          <div className="agent-stat-grid">
            <div className="agent-stat-card">
              <span className="label">{t('agent.referralCode')}</span>
              <span className="value code">{summary.referral_code ?? '—'}</span>
              <span className="hint">{t('agent.referralHint')}</span>
            </div>
            <div className="agent-stat-card">
              <span className="label">{t('agent.commissionRate')}</span>
              <span className="value">{fmtNumber(summary.commission_rate, 2)}%</span>
              <span className="hint">{t('agent.rateHint')}</span>
            </div>
            <div className="agent-stat-card">
              <span className="label">{t('agent.customerCount')}</span>
              <span className="value">{fmtNumber(summary.customer_count)}</span>
            </div>
            <div className="agent-stat-card">
              <span className="label">{t('agent.confirmedTotal')}</span>
              <span className="value">{fmtBaht(summary.confirmed_total)}</span>
            </div>
            <div className="agent-stat-card">
              <span className="label">{t('agent.monthCommission')}</span>
              <span className="value">{fmtBaht(summary.months.find((m) => !m.locked)?.commission ?? 0)}</span>
            </div>
            <div className="agent-stat-card highlight">
              <span className="label">{t('agent.myCommission')}</span>
              <span className="value">{fmtBaht(summary.commission)}</span>
            </div>
          </div>
          <p style={{ fontSize: 'calc(13px * var(--fs))', color: 'var(--ink-soft)' }}>
            {t('agent.commissionNote')}
          </p>

          <h3 style={{ margin: '24px 0 10px' }}>{t('agent.historyTitle')}</h3>
          {summary.months.length === 0 ? (
            <div className="empty-state">{t('agent.noHistory')}</div>
          ) : (
            <div className="table-wrap">
              <table className="report-table commission-history">
                <thead>
                  <tr>
                    <th>{t('agent.colMonth')}</th>
                    <th>{t('agent.colBookings')}</th>
                    <th>{t('agent.colSales')}</th>
                    <th>{t('agent.colRate')}</th>
                    <th>{t('agent.colCommission')}</th>
                    <th>{t('agent.colMonthStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.months.map((m) => (
                    <tr key={m.month}>
                      <td>{fmtMonth(m.month)}</td>
                      <td>{fmtNumber(m.bookings)}</td>
                      <td>{fmtBaht(m.sales)}</td>
                      <td>{m.rates.map((x) => `${fmtNumber(x, 0)}%`).join(', ') || '—'}</td>
                      <td>
                        <strong>{fmtBaht(m.commission)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${m.locked ? 'badge-confirmed' : 'badge-pending'}`}>
                          {m.locked ? t('agent.monthLocked') : t('agent.monthOpen')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      <h3 style={{ margin: '24px 0 10px' }}>{t('agent.membersTitle')}</h3>
      {!members ? (
        <div className="empty-state">{t('admin.loading')}</div>
      ) : members.length === 0 ? (
        <div className="empty-state">{t('agent.noMembers')}</div>
      ) : (
        <div className="table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('admin.colName')}</th>
                <th>{t('login.email')}</th>
                <th>{t('admin.colPhone')}</th>
                <th>{t('agent.colStatus')}</th>
                <th>{t('agent.colConfirmedTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone || '—'}</td>
                  <td>
                    <span className={`badge ${m.approved ? 'badge-confirmed' : 'badge-pending'}`}>
                      {m.approved ? t('agent.approved') : t('agent.waiting')}
                    </span>
                  </td>
                  <td>{fmtBaht(m.confirmed_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AgentPage;
