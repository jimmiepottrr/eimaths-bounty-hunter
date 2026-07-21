/** หน้าแอดมิน — 3 แท็บ: อนุมัติสมาชิก / ยืนยันการจอง / แก้ไขราคา */

import { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { dataService } from '../data/service';
import { UNIT_LABEL, type Booking, type Product, type User } from '../data/types';
import { fmtDateTime, fmtNumber } from '../format';

type Tab = 'users' | 'bookings' | 'prices';

const PendingUsersTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const [users, setUsers] = useState<User[] | null>(null);

  const reload = useCallback(() => {
    dataService
      .listPendingUsers()
      .then(setUsers)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  useEffect(reload, [reload]);

  if (!users) return <div className="empty-state">กำลังโหลด…</div>;
  if (users.length === 0) return <div className="empty-state">ไม่มีสมาชิกที่รอการอนุมัติ</div>;

  const act = async (id: number, approved: boolean) => {
    try {
      await dataService.setUserApproval(id, approved);
      onToast(approved ? 'อนุมัติสมาชิกแล้ว' : 'ปฏิเสธสมาชิกแล้ว');
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
            <th>ชื่อ</th>
            <th>อีเมล</th>
            <th>เบอร์โทร</th>
            <th>จัดการ</th>
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
                  อนุมัติ
                </button>
                <button type="button" className="btn btn-outline btn-small" onClick={() => act(u.id, false)}>
                  ปฏิเสธ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BookingsTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const reload = useCallback(() => {
    dataService
      .listAllBookings()
      .then(setBookings)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  useEffect(reload, [reload]);

  if (!bookings) return <div className="empty-state">กำลังโหลด…</div>;
  if (bookings.length === 0) return <div className="empty-state">ยังไม่มีรายการจอง</div>;

  const confirm = async (id: number) => {
    try {
      await dataService.confirmBooking(id);
      onToast('ยืนยันการจองแล้ว');
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
            <th>ผู้จอง</th>
            <th>สินค้า</th>
            <th>จำนวน</th>
            <th>ราคา ณ วันจอง</th>
            <th>ยอดประมาณการ</th>
            <th>วันที่จอง</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.user_name ?? `#${b.user_id}`}</td>
              <td>{b.product_name}</td>
              <td>
                {fmtNumber(b.quantity)} {UNIT_LABEL[b.unit]}
              </td>
              <td>{fmtNumber(b.price_at_booking)}</td>
              <td>{fmtNumber(b.total_estimate)}</td>
              <td>{fmtDateTime(b.created_at)}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
              <td>
                {b.status === 'pending' && (
                  <button type="button" className="btn btn-primary btn-small" onClick={() => confirm(b.id)}>
                    ยืนยัน
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PriceEditRow = ({ product, onToast }: { product: Product; onToast: (m: string) => void }) => {
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
      onToast(`บันทึกราคา ${product.name_th} แล้ว`);
    } catch (e) {
      onToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="price-edit-row">
      <div>
        <strong>{product.name_th}</strong>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{product.name_en}</div>
      </div>
      <input aria-label="ราคา" type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input aria-label="High" type="number" step="any" value={high} onChange={(e) => setHigh(e.target.value)} />
      <input aria-label="Low" type="number" step="any" value={low} onChange={(e) => setLow(e.target.value)} />
      <button type="button" className="btn btn-primary btn-small" onClick={save} disabled={busy}>
        บันทึก
      </button>
    </div>
  );
};

const PricesTab = ({ onToast }: { onToast: (m: string) => void }) => {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    dataService
      .listProducts()
      .then(setProducts)
      .catch((e) => onToast((e as Error).message));
  }, [onToast]);

  if (!products) return <div className="empty-state">กำลังโหลด…</div>;

  return (
    <div className="card">
      <div className="price-edit-row" style={{ fontSize: 13, color: 'var(--ink-soft)', borderBottom: '2px solid var(--line)' }}>
        <div>สินค้า</div>
        <div>ราคา (บาท/กก.)</div>
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

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('users');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <div className="section-heading">
        <h2>แอดมิน</h2>
        <span className="en">Admin Console</span>
      </div>

      <div className="admin-tabs">
        <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          อนุมัติสมาชิก
        </button>
        <button type="button" className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>
          ยืนยันการจอง
        </button>
        <button type="button" className={tab === 'prices' ? 'active' : ''} onClick={() => setTab('prices')}>
          แก้ไขราคา
        </button>
      </div>

      {tab === 'users' && <PendingUsersTab onToast={setToast} />}
      {tab === 'bookings' && <BookingsTab onToast={setToast} />}
      {tab === 'prices' && <PricesTab onToast={setToast} />}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

export default AdminPage;
