import type { BookingStatus } from '../data/types';

const StatusBadge = ({ status }: { status: BookingStatus }) =>
  status === 'confirmed' ? (
    <span className="badge badge-confirmed">ได้รับการยืนยันแล้ว</span>
  ) : (
    <span className="badge badge-pending">รอการยืนยัน</span>
  );

export default StatusBadge;
