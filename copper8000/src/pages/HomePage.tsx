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
