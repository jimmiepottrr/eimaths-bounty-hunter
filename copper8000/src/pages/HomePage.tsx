/** หน้าแรก — บอร์ดราคาแบบ row ไล่สี (แสดงอย่างเดียว จองไม่ได้) จัดกลุ่มตามชนิดโลหะ */

import { useEffect, useState } from 'react';
import PriceRow from '../components/PriceRow';
import { dataService } from '../data/service';
import type { Material, Product } from '../data/types';
import { fmtToday } from '../format';
import { useT } from '../i18n';
import { useAuth } from '../store';

const MATERIAL_ORDER: Material[] = ['copper', 'brass', 'aluminium'];

const MATERIAL_EN: Record<Material, string> = {
  copper: 'Copper',
  brass: 'Brass',
  aluminium: 'Aluminium',
};

// ---------- รังผึ้งจุดเด่นบริษัท (ใต้แถบวิ่ง) — PC แถวเดียว resize ตามจอ · มือถือ 2×2 ----------
// ฿ ทำเป็น SVG (viewBox เดียวกับไอคอนอื่น) → ขนาดเท่ากันเป๊ะทุกป้าย
const BahtIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <text
      x="12"
      y="12.5"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="'Prompt','Sarabun','Noto Sans Thai',system-ui,sans-serif"
      fontWeight="700"
      fontSize="23"
      fill="currentColor"
    >
      ฿
    </text>
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Zm-1 13-3.5-3.5 1.4-1.4L11 12.2l4.1-4.1 1.4 1.4L11 15Z" />
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);
// หูโทรศัพท์บ้านแบบโบราณ — สื่อถึง "บริการ / ติดต่อสอบถาม"
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.46.57 3.58.11.35.03.74-.24 1.02L6.6 10.8Z" />
  </svg>
);

const TRUST_ITEMS: { key: string; Icon: () => JSX.Element }[] = [
  { key: 'fair', Icon: BahtIcon }, // ฿
  { key: 'solid', Icon: ShieldIcon },
  { key: 'honest', Icon: HeartIcon },
  { key: 'service', Icon: PhoneIcon },
];

const TrustHoneycomb = () => {
  const t = useT();
  return (
    <div className="trust-comb trust-comb-text" role="list" aria-label={t('home.trust.aria')}>
      {TRUST_ITEMS.map(({ key }) => (
        <div className="trust-cell" role="listitem" key={key}>
          <span className="hex-badge hex-badge-text">
            <span className="hex-label">{t(`home.trust.${key}.title`)}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const HomePage = () => {
  const t = useT();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataService
      .listProducts()
      .then(setProducts)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <>
      {/* รังผึ้งจุดเด่นบริษัท — ใต้แถบวิ่ง (PC แถวเดียว · มือถือ 2×2) */}
      <TrustHoneycomb />

      {/* ข้อความแนะนำ: โชว์ตอนยังไม่ login · ซ่อนเมื่อ login แล้ว (เข้าดูราคาได้เลย) */}
      {!user && (
        <div className="hero">
          <h1>{t('home.title')}</h1>
          <p>{t('home.subtitle')}</p>
          <div className="pricedate">{t('home.asOf', { date: fmtToday() })}</div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
      {!products && !error && <div className="empty-state">{t('home.loading')}</div>}

      {products &&
        MATERIAL_ORDER.map((material) => {
          const group = products.filter((p) => p.material === material);
          if (group.length === 0) return null;
          return (
            <section key={material}>
              <div className="section-heading">
                <h2>{t(`material.${material}`)}</h2>
                <span className="en">{MATERIAL_EN[material]}</span>
              </div>
              <div className="price-board">
                {group.map((p, i) => (
                  <PriceRow key={p.id} product={p} index={i} order={i + 1} />
                ))}
              </div>
            </section>
          );
        })}
    </>
  );
};

export default HomePage;
