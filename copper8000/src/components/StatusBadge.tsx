import { useT } from '../i18n';
import type { BookingStatus } from '../data/types';

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const t = useT();
  if (status === 'confirmed') return <span className="badge badge-confirmed">{t('status.confirmed')}</span>;
  if (status === 'cancelled') return <span className="badge badge-cancelled">{t('status.cancelled')}</span>;
  return <span className="badge badge-pending">{t('status.pending')}</span>;
};

export default StatusBadge;
