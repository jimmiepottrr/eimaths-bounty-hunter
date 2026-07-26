/** หน้าแอดมิน — 4 แท็บ: อนุมัติสมาชิก / ยืนยันการจอง / แก้ไขราคา / ภาษา */

import { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { dataService } from '../data/service';
import type { Booking, LanguageInfo, Product, User } from '../data/types';
import { fmtDate, fmtNumber } from '../format';
import { DICT_TEMPLATE } from '../i18n/core';
import { bookingProductName, productName, productSubName, useI18n } from '../i18n';
import { applyTheme, currentTheme, type ThemeCode } from '../themeManager';

type Tab = 'users' | 'bookings' | 'report' | 'prices' | 'languages' | 'settings';

const PendingUsersTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[] | null>(null);

  const reload = useCallback(() => {
    dataService
      .listPendingUsers()
      .then(setUsers)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  useEffect(reload, [reload]);

  if (!users) return <div className="empty-state">{t('admin.loading')}</div>;
  if (users.length === 0) return <div className="empty-state">{t('admin.noPending')}</div>;

  const act = async (id: number, approved: boolean) => {
    try {
      await dataService.setUserApproval(id, approved);
      onToast(approved ? t('admin.toastApproved') : t('admin.toastRejected'));
      reload();
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  return (
    <div className="table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>{t('admin.colName')}</th>
            <th>{t('login.email')}</th>
            <th>{t('admin.colPhone')}</th>
            <th>{t('admin.colManage')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-primary btn-small" onClick={() => act(u.id, true)}>
                  {t('admin.approve')}
                </button>
                <button type="button" className="btn btn-outline btn-small" onClick={() => act(u.id, false)}>
                  {t('admin.reject')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** แถวการจอง 1 รายการ — แอดมินกรอกน้ำหนักส่งจริง + QC ได้ในตัว (หลังยืนยันแล้ว) */
const BookingRow = ({
  b,
  onConfirm,
  onReload,
  onToast,
}: {
  b: Booking;
  onConfirm: (id: number) => void;
  onReload: () => void;
  onToast: (m: string) => void;
}) => {
  const { lang, t } = useI18n();
  const [actual, setActual] = useState(b.actual_weight_kg != null ? String(b.actual_weight_kg) : '');
  const [qc, setQc] = useState(b.qc_weight_kg != null ? String(b.qc_weight_kg) : '');
  const [busy, setBusy] = useState(false);

  const saveWeights = async () => {
    setBusy(true);
    try {
      await dataService.setBookingWeights(b.id, {
        actual_weight_kg: actual.trim() === '' ? null : Number(actual),
        qc_weight_kg: qc.trim() === '' ? null : Number(qc),
      });
      onToast(t('admin.toastWeightsSaved'));
      onReload();
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>{b.user_name ?? `#${b.user_id}`}</td>
      <td>{bookingProductName(b, lang)}</td>
      <td>
        {fmtNumber(b.quantity)} {t(`unit.${b.unit}`)}
      </td>
      <td>{b.delivery_date ? fmtDate(b.delivery_date) : '—'}</td>
      <td>
        <StatusBadge status={b.status} />
      </td>
      <td>
        <input
          className="w-input"
          aria-label="actual"
          type="number"
          step="any"
          min="0"
          placeholder={t('admin.wActual')}
          value={actual}
          onChange={(e) => setActual(e.target.value)}
        />
      </td>
      <td>
        <input
          className="w-input"
          aria-label="qc"
          type="number"
          step="any"
          min="0"
          placeholder={t('admin.wQc')}
          value={qc}
          onChange={(e) => setQc(e.target.value)}
        />
      </td>
      <td style={{ display: 'flex', gap: 8 }}>
        {b.status === 'pending' && (
          <button type="button" className="btn btn-primary btn-small" onClick={() => onConfirm(b.id)}>
            {t('admin.confirmBtn')}
          </button>
        )}
        <button type="button" className="btn btn-outline btn-small" onClick={saveWeights} disabled={busy}>
          {t('admin.saveWeights')}
        </button>
      </td>
    </tr>
  );
};

const BookingsTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const reload = useCallback(() => {
    dataService
      .listAllBookings()
      .then(setBookings)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  useEffect(reload, [reload]);

  if (!bookings) return <div className="empty-state">{t('admin.loading')}</div>;
  if (bookings.length === 0) return <div className="empty-state">{t('admin.noBookings')}</div>;

  const confirm = async (id: number) => {
    try {
      await dataService.confirmBooking(id);
      onToast(t('admin.toastConfirmed'));
      reload();
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  return (
    <div className="table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>{t('admin.colBooker')}</th>
            <th>{t('report.colProduct')}</th>
            <th>{t('report.colQty')}</th>
            <th>{t('admin.colDelivery')}</th>
            <th>{t('report.colStatus')}</th>
            <th>{t('admin.colActualKg')}</th>
            <th>{t('admin.colQcKg')}</th>
            <th>{t('admin.colManage')}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <BookingRow key={b.id} b={b} onConfirm={confirm} onReload={reload} onToast={onToast} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PriceEditRow = ({ product, onToast }: { product: Product; onToast: (m: string) => void }) => {
  const { lang, t } = useI18n();
  const [price, setPrice] = useState(String(product.price_per_kg));
  const [high, setHigh] = useState(String(product.high_of_day));
  const [low, setLow] = useState(String(product.low_of_day));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await dataService.updatePrice(product.id, {
        price_per_kg: Number(price),
        high_of_day: Number(high),
        low_of_day: Number(low),
      });
      onToast(t('admin.toastPriceSaved', { name: productName(product, lang) }));
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="price-edit-row">
      <div>
        <strong>{productName(product, lang)}</strong>
        {productSubName(product, lang) && (
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{productSubName(product, lang)}</div>
        )}
      </div>
      <input aria-label="price" type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input aria-label="high" type="number" step="any" value={high} onChange={(e) => setHigh(e.target.value)} />
      <input aria-label="low" type="number" step="any" value={low} onChange={(e) => setLow(e.target.value)} />
      <button type="button" className="btn btn-primary btn-small" onClick={save} disabled={busy}>
        {t('admin.save')}
      </button>
    </div>
  );
};

const PricesTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    dataService
      .listProducts()
      .then(setProducts)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  if (!products) return <div className="empty-state">{t('admin.loading')}</div>;

  return (
    <div className="card">
      <div
        className="price-edit-row"
        style={{ fontSize: 13, color: 'var(--ink-soft)', borderBottom: '2px solid var(--line)' }}
      >
        <div>{t('report.colProduct')}</div>
        <div>{t('admin.colPriceBahtKg')}</div>
        <div>High</div>
        <div>Low</div>
        <div />
      </div>
      {products.map((p) => (
        <PriceEditRow key={p.id} product={p} onToast={onToast} />
      ))}
    </div>
  );
};

// ---------- แท็บรายงาน (สรุปจอง vs ส่งจริง vs QC ต่อสินค้า) ----------

const toKg = (b: Booking) => (b.unit === 'ton' ? b.quantity * 1000 : b.quantity);

const ReportTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { lang, t } = useI18n();
  const [data, setData] = useState<{ products: Product[]; bookings: Booking[] } | null>(null);

  useEffect(() => {
    Promise.all([dataService.listProducts(), dataService.listAllBookings()])
      .then(([products, bookings]) => setData({ products, bookings }))
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  if (!data) return <div className="empty-state">{t('admin.loading')}</div>;

  const rows = data.products
    .map((p) => {
      const bs = data.bookings.filter((b) => b.product_id === p.id);
      return {
        p,
        count: bs.length,
        booked: bs.reduce((s, b) => s + toKg(b), 0),
        actual: bs.reduce((s, b) => s + (b.actual_weight_kg ?? 0), 0),
        qc: bs.reduce((s, b) => s + (b.qc_weight_kg ?? 0), 0),
      };
    })
    .filter((r) => r.count > 0);

  if (rows.length === 0) return <div className="empty-state">{t('admin.noBookings')}</div>;

  const tot = rows.reduce(
    (a, r) => ({
      count: a.count + r.count,
      booked: a.booked + r.booked,
      actual: a.actual + r.actual,
      qc: a.qc + r.qc,
    }),
    { count: 0, booked: 0, actual: 0, qc: 0 },
  );

  return (
    <div className="table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>{t('report.colProduct')}</th>
            <th>{t('adminReport.count')}</th>
            <th>{t('adminReport.booked')}</th>
            <th>{t('adminReport.actual')}</th>
            <th>{t('adminReport.qc')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p.id}>
              <td>{productName(r.p, lang)}</td>
              <td>{fmtNumber(r.count)}</td>
              <td>{fmtNumber(r.booked)}</td>
              <td>{r.actual ? fmtNumber(r.actual) : '—'}</td>
              <td>{r.qc ? fmtNumber(r.qc) : '—'}</td>
            </tr>
          ))}
          <tr className="report-total-row">
            <td>{t('adminReport.total')}</td>
            <td>{fmtNumber(tot.count)}</td>
            <td>{fmtNumber(tot.booked)}</td>
            <td>{fmtNumber(tot.actual)}</td>
            <td>{fmtNumber(tot.qc)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 10 }}>{t('adminReport.note')}</p>
    </div>
  );
};

// ---------- แท็บภาษา ----------

const LanguagesTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { t, reloadLanguages } = useI18n();
  const [languages, setLanguages] = useState<LanguageInfo[] | null>(null);
  const [editing, setEditing] = useState<LanguageInfo | null>(null);
  const [code, setCode] = useState('');
  const [nameNative, setNameNative] = useState('');
  const [dictText, setDictText] = useState(() => JSON.stringify(DICT_TEMPLATE, null, 2));
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    dataService
      .listAllLanguages()
      .then(setLanguages)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  useEffect(reload, [reload]);

  if (!languages) return <div className="empty-state">{t('admin.loading')}</div>;

  const enabledCount = languages.filter((l) => l.enabled).length;

  const refreshEverywhere = async () => {
    reload();
    await reloadLanguages();
  };

  const toggle = async (l: LanguageInfo) => {
    try {
      await dataService.setLanguageEnabled(l.code, !l.enabled);
      await refreshEverywhere();
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  const remove = async (l: LanguageInfo) => {
    if (!window.confirm(t('adminLang.confirmDelete', { name: l.name_native }))) return;
    try {
      await dataService.deleteLanguage(l.code);
      onToast(t('adminLang.toastDeleted'));
      await refreshEverywhere();
    } catch (e) {
      onToast((e as Error).message);
    }
  };

  const startEdit = (l: LanguageInfo) => {
    setEditing(l);
    setCode(l.code);
    setNameNative(l.name_native);
    setDictText(JSON.stringify(l.dict ?? DICT_TEMPLATE, null, 2));
  };

  const resetForm = () => {
    setEditing(null);
    setCode('');
    setNameNative('');
    setDictText(JSON.stringify(DICT_TEMPLATE, null, 2));
  };

  const parseDict = (): Record<string, string> | null => {
    try {
      const parsed = JSON.parse(dictText) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      if (!Object.values(parsed as object).every((v) => typeof v === 'string')) return null;
      return parsed as Record<string, string>;
    } catch {
      return null;
    }
  };

  const submit = async () => {
    const dict = parseDict();
    if (!dict) {
      onToast(t('adminLang.jsonInvalid'));
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await dataService.updateLanguage(editing.code, { name_native: nameNative, dict });
        onToast(t('adminLang.toastUpdated'));
      } else {
        await dataService.addLanguage({ code, name_native: nameNative, dict });
        onToast(t('adminLang.toastAdded'));
      }
      resetForm();
      await refreshEverywhere();
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('adminLang.colCode')}</th>
              <th>{t('adminLang.colName')}</th>
              <th>{t('adminLang.colType')}</th>
              <th>{t('adminLang.colStatus')}</th>
              <th>{t('admin.colManage')}</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((l) => (
              <tr key={l.code}>
                <td>{l.code}</td>
                <td>{l.name_native}</td>
                <td>{l.built_in ? t('adminLang.builtIn') : t('adminLang.custom')}</td>
                <td>
                  <span className={`badge ${l.enabled ? 'badge-confirmed' : 'badge-pending'}`}>
                    {l.enabled ? t('adminLang.enabled') : t('adminLang.disabled')}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={() => toggle(l)}
                    disabled={l.enabled && enabledCount <= 1}
                  >
                    {l.enabled ? t('adminLang.disable') : t('adminLang.enable')}
                  </button>
                  {!l.built_in && (
                    <>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => startEdit(l)}>
                        {t('adminLang.edit')}
                      </button>
                      <button type="button" className="btn btn-outline btn-small" onClick={() => remove(l)}>
                        {t('adminLang.delete')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          {editing ? t('adminLang.editTitle', { code: editing.code }) : t('adminLang.addTitle')}
        </h3>
        {!editing && (
          <div className="field">
            <label htmlFor="lang-code">{t('adminLang.codeLabel')}</label>
            <input id="lang-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="lang-name">{t('adminLang.nameLabel')}</label>
          <input id="lang-name" value={nameNative} onChange={(e) => setNameNative(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lang-dict">{t('adminLang.dictLabel')}</label>
          <textarea
            id="lang-dict"
            className="dict-editor"
            rows={14}
            value={dictText}
            onChange={(e) => setDictText(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? t('adminLang.saving') : editing ? t('adminLang.saveBtn') : t('adminLang.addBtn')}
          </button>
          {editing && (
            <button type="button" className="btn btn-outline" onClick={resetForm} disabled={busy}>
              {t('booking.cancel')}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ---------- แท็บตั้งค่า (ธีมสีของเว็บ) ----------

const THEME_SWATCHES: Record<ThemeCode, string[]> = {
  gold: ['#c9a227', '#e0c14f', '#f6efd9'],
  copper: ['#a76a3a', '#c98d5c', '#f5f1e6'],
  silver: ['#7c8794', '#a6b0bb', '#eef1f4'],
};

const SettingsTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const { t } = useI18n();
  const [theme, setThemeState] = useState<ThemeCode>(currentTheme());
  const [busy, setBusy] = useState(false);

  const choose = async (code: ThemeCode) => {
    if (busy || code === theme) return;
    const previous = theme;
    applyTheme(code); // เห็นผลทันทีทั้งเว็บ
    setThemeState(code);
    setBusy(true);
    try {
      await dataService.setTheme(code);
      onToast(t('adminTheme.saved'));
    } catch (e) {
      applyTheme(previous); // บันทึกไม่สำเร็จ → ย้อนกลับ
      setThemeState(previous);
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t('adminTheme.title')}</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 0 }}>{t('adminTheme.note')}</p>
      <div className="theme-grid">
        {(Object.keys(THEME_SWATCHES) as ThemeCode[]).map((code) => (
          <button
            key={code}
            type="button"
            className={`theme-card ${theme === code ? 'selected' : ''}`}
            onClick={() => choose(code)}
            disabled={busy}
          >
            <span className="swatches">
              {THEME_SWATCHES[code].map((c) => (
                <span key={c} className="dot" style={{ background: c }} />
              ))}
            </span>
            <span className="name">{t(`theme.${code}`)}</span>
            {theme === code && <span className="check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

/** แผงหัวข้อแจ้งว่ามีเรื่องอะไรรอ approve บ้าง — กดการ์ดเพื่อกระโดดไปแท็บนั้น */
const PendingSummary = ({
  refreshKey,
  onNavigate,
}: {
  refreshKey: number;
  onNavigate: (tab: Tab) => void;
}) => {
  const { t } = useI18n();
  const [counts, setCounts] = useState<{ users: number; bookings: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([dataService.listPendingUsers(), dataService.listAllBookings()])
      .then(([users, bookings]) => {
        if (!cancelled) {
          setCounts({
            users: users.length,
            bookings: bookings.filter((b) => b.status === 'pending').length,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!counts) return null;

  return (
    <>
      <h3 style={{ margin: '0 0 10px' }}>{t('admin.pendingTitle')}</h3>
      {counts.users === 0 && counts.bookings === 0 ? (
        <div className="success-box" style={{ marginBottom: 20 }}>
          ✓ {t('admin.nonePending')}
        </div>
      ) : (
        <div className="pending-grid">
          {counts.users > 0 && (
            <button type="button" className="pending-card" onClick={() => onNavigate('users')}>
              <span className="cnt">{counts.users}</span>
              <span className="topic">{t('admin.topicUsers')}</span>
            </button>
          )}
          {counts.bookings > 0 && (
            <button type="button" className="pending-card" onClick={() => onNavigate('bookings')}>
              <span className="cnt">{counts.bookings}</span>
              <span className="topic">{t('admin.topicBookings')}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};

const AdminPage = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('users');
  const [toast, setToast] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  // ทุก action ในแท็บ (อนุมัติ/ยืนยัน/ฯลฯ) เด้ง toast + รีเฟรชแผงรอดำเนินการ
  const notify = useCallback((message: string) => {
    setToast(message);
    setRefresh((r) => r + 1);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <>
      <div className="section-heading">
        <h2>{t('nav.admin')}</h2>
        <span className="en">Admin Console</span>
      </div>

      <PendingSummary refreshKey={refresh} onNavigate={setTab} />

      <div className="admin-tabs">
        <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          {t('admin.tabUsers')}
        </button>
        <button type="button" className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>
          {t('admin.tabBookings')}
        </button>
        <button type="button" className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
          {t('admin.tabReport')}
        </button>
        <button type="button" className={tab === 'prices' ? 'active' : ''} onClick={() => setTab('prices')}>
          {t('admin.tabPrices')}
        </button>
        <button type="button" className={tab === 'languages' ? 'active' : ''} onClick={() => setTab('languages')}>
          {t('admin.tabLanguages')}
        </button>
        <button type="button" className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          {t('admin.tabSettings')}
        </button>
      </div>

      {tab === 'users' && <PendingUsersTab onToast={notify} />}
      {tab === 'bookings' && <BookingsTab onToast={notify} />}
      {tab === 'report' && <ReportTab onToast={notify} />}
      {tab === 'prices' && <PricesTab onToast={notify} />}
      {tab === 'languages' && <LanguagesTab onToast={notify} />}
      {tab === 'settings' && <SettingsTab onToast={notify} />}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

export default AdminPage;
