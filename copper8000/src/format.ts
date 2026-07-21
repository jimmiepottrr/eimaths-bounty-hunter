export const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 2) });

export const fmtBaht = (n: number) => `${fmtNumber(n)} บาท`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const todayThai = () =>
  new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
