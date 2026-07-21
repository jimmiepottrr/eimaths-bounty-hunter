/** รายงานการจอง — 10 รายการล่าสุดของผู้ใช้ คอลัมน์สุดท้ายคือสถานะ */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { dataService } from '../data/service';
import type { Booking } from '../data/types';
import { fmtDateTime, fmtNumber } from '../format';
import { bookingProductName, useI18n } from '../i18n';

const BookingReportPage = () => {
  const { lang, t } = useI18n();
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
        <h2>{t('report.heading')}</h2>
        <span className="en">{t('report.latest10')}</span>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!bookings && !error && <div className="empty-state">{t('report.loading')}</div>}

      {bookings && bookings.length === 0 && (
        <div className="empty-state">
          {t('report.emptyPrefix')} <Link to="/products">{t('nav.products')}</Link>{' '}
          {t('report.emptySuffix')}
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('report.colProduct')}</th>
                <th>{t('report.colQty')}</th>
                <th>{t('report.colPrice')}</th>
                <th>{t('report.colTotal')}</th>
                <th>{t('report.colDate')}</th>
                <th>{t('report.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{bookingProductName(b, lang)}</td>
                  <td>
                    {fmtNumber(b.quantity)} {t(`unit.${b.unit}`)}
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
