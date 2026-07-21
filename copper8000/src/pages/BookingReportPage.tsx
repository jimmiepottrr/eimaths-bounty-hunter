/** รายงานการจอง — 10 รายการล่าสุดของผู้ใช้ คอลัมน์สุดท้ายคือสถานะ */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { dataService } from '../data/service';
import { UNIT_LABEL, type Booking } from '../data/types';
import { fmtDateTime, fmtNumber } from '../format';

const BookingReportPage = () => {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataService
      .listMyBookings()
      .then(setBookings)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <>
      <div className="section-heading">
        <h2>รายงานการจอง</h2>
        <span className="en">10 รายการล่าสุด</span>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!bookings && !error && <div className="empty-state">กำลังโหลดรายการจอง…</div>}

      {bookings && bookings.length === 0 && (
        <div className="empty-state">
          ยังไม่มีรายการจอง — ไปที่หน้า <Link to="/products">สินค้า</Link> เพื่อจองราคา
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ราคา ณ วันจอง (บาท/กก.)</th>
                <th>ยอดประมาณการ (บาท)</th>
                <th>วันที่จอง</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default BookingReportPage;
