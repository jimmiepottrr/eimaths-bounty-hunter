import { useT } from '../i18n';
import type { BookingStatus } from '../data/types';

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const t = useT();
  return status === 'confirmed' ? (
    <span className="badge badge-confirmed">{t('status.confirmed')}</span>
  ) : (
    <span className="badge badge-pending">{t('status.pending')}</span>
  );
};

export default StatusBadge;
