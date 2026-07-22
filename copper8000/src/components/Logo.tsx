/** โลโก้ C8 hexagon ทองแดง (สีแบรนด์เดิมทุกจุด) + wordmark
 *  ขนาด/ฟอนต์คุมด้วยคลาส CSS (.logo-mark / .logo-word-*) เพื่อย่อบนมือถือได้ */

import { useI18n } from '../i18n';

const Mark = () => (
  <svg className="logo-mark" width={44} height={44} viewBox="0 0 120 120" aria-hidden="true">
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
      d="M78 14 L34 14 L12 60 L34 106 L78 106"
      fill="none"
      stroke="url(#c8-copper)"
      strokeWidth="16"
      strokeLinejoin="miter"
    />
    {/* trick: เลข 8 ใหญ่เกือบเต็มความสูง — เด่นพอดีกับ header */}
    <text
      x="72"
      y="98"
      textAnchor="middle"
      fontFamily="'Noto Sans Thai', sans-serif"
      fontSize="108"
      fontWeight="800"
      fill="url(#c8-copper-2)"
    >
      8
    </text>
  </svg>
);

const Logo = () => {
  const { lang } = useI18n();
  return (
    <span className="logo-wrap">
      <Mark />
      <span className="logo-word">
        <span className={`logo-word-main ${lang === 'th' ? '' : 'latin'}`}>
          {lang === 'th' ? 'คอปเปอร์ 8000' : 'COPPER 8000'}
        </span>
        <span className="logo-word-sub">COPPER 8000 CO., LTD.</span>
      </span>
    </span>
  );
};

export default Logo;
