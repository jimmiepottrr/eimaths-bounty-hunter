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
const ScaleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a1.3 1.3 0 0 0-1.3 1.3c0 .5.28.94.7 1.16V6H5.5a1 1 0 0 0 0 2h.34l-2.3 5.05A1 1 0 0 0 3.4 13c0 1.6 1.5 2.8 3.35 2.8S10.1 14.6 10.1 13a1 1 0 0 0-.13-.5L7.7 8h3V19H7.5a1 1 0 0 0 0 2h9a1 1 0 0 0 0-2h-3.2V8h3l-2.27 5A1 1 0 0 0 13.9 13c0 1.6 1.5 2.8 3.35 2.8S20.6 14.6 20.6 13a1 1 0 0 0-.14-.5L18.16 8h.34a1 1 0 0 0 0-2h-5.9V4.46c.42-.22.7-.66.7-1.16A1.3 1.3 0 0 0 12 2ZM6.75 10.2 8.1 13.2H5.4l1.35-3ZM17.25 10.2l1.35 3h-2.7l1.35-3Z" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Zm-1 13-3.5-3.5 1.4-1.4L11 12.2l4.1-4.1 1.4 1.4L11 15Z" />
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-10-9.3C.7 9 1.7 5.5 5 4.8c2-.4 3.7.5 5 2.2 1.3-1.7 3-2.6 5-2.2 3.3.7 4.3 4.2 3 6.9C19.5 16.4 12 21 12 21Z" />
  </svg>
);
const TruckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1a2.5 2.5 0 0 0 5 0h5a2.5 2.5 0 0 0 5 0h1a1 1 0 0 0 1-1v-3.6a2 2 0 0 0-.4-1.2l-2.1-2.8a2 2 0 0 0-1.6-.8H16V6a1 1 0 0 0-1-1H3Zm13 4h1.9l2.1 2.8V13h-4V9ZM6.5 15.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm10 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
  </svg>
);

const TRUST_ITEMS = [
  { key: 'fair', Icon: ScaleIcon },
  { key: 'solid', Icon: ShieldIcon },
  { key: 'honest', Icon: HeartIcon },
  { key: 'service', Icon: TruckIcon },
] as const;

const TrustHoneycomb = () => {
  const t = useT();
  return (
    <div className="trust-comb" role="list" aria-label={t('home.trust.aria')}>
      {TRUST_ITEMS.map(({ key, Icon }) => (
        <div className="trust-cell" role="listitem" key={key}>
          <span className="hex-badge" aria-hidden="true">
            <Icon />
          </span>
          <div className="trust-title">{t(`home.trust.${key}.title`)}</div>
          <div className="trust-sub">{t(`home.trust.${key}.sub`)}</div>
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
