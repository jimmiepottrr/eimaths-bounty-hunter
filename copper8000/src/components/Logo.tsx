/** โลโก้ C8 hexagon ทองแดง (วาดใหม่เป็น SVG ตามอาร์ตเวิร์กบริษัท) + wordmark
 *  wordmark หลักเป็นไทยเฉพาะตอนดูภาษาไทย — ภาษาอื่นใช้ COPPER 8000 (กันตัวไทยโผล่หน้า EN/中文) */

import { useI18n } from '../i18n';

const Mark = ({ size = 44 }: { size?: number }) => (
  <svg className="logo-mark" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <linearGradient id="c8-copper" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c98d5c" />
        <stop offset="45%" stopColor="#a76a3a" />
        <stop offset="100%" stopColor="#7c4a24" />
      </linearGradient>
      <linearGradient id="c8-copper-2" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#8a5628" />
        <stop offset="55%" stopColor="#b87a44" />
        <stop offset="100%" stopColor="#d9a06a" />
      </linearGradient>
    </defs>
    {/* hexagon เปิดด้านขวา = ตัว C */}
    <path
      d="M88 22 L38 22 L14 60 L38 98 L88 98"
      fill="none"
      stroke="url(#c8-copper)"
      strokeWidth="17"
      strokeLinejoin="miter"
    />
    <text
      x="74"
      y="83"
      fontFamily="'Noto Sans Thai', sans-serif"
      fontSize="64"
      fontWeight="700"
      fill="url(#c8-copper-2)"
    >
      8
    </text>
  </svg>
);

const Logo = ({ compact = false }: { compact?: boolean }) => {
  const { lang } = useI18n();
  return (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <Mark size={compact ? 36 : 44} />
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
      <span
        style={{
          fontFamily: "'Noto Serif Thai', serif",
          fontWeight: 700,
          fontSize: compact ? 16 : 19,
          color: 'var(--logo-main, #7c4a24)',
          letterSpacing: lang === 'th' ? undefined : '0.06em',
        }}
      >
        {lang === 'th' ? 'คอปเปอร์ 8000' : 'COPPER 8000'}
      </span>
      <span
        style={{
          fontSize: compact ? 9 : 10.5,
          letterSpacing: '0.18em',
          color: 'var(--logo-sub, #a76a3a)',
          borderTop: '1px solid var(--logo-line, #d8c79a)',
          paddingTop: 2,
        }}
      >
        COPPER 8000 CO., LTD.
      </span>
    </span>
  </span>
  );
};

export default Logo;
