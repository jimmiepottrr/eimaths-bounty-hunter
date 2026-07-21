/** หน้าแรก — บอร์ดราคาแบบ row ไล่สี (แสดงอย่างเดียว จองไม่ได้) จัดกลุ่มตามชนิดโลหะ */

import { useEffect, useState } from 'react';
import PriceRow from '../components/PriceRow';
import { dataService } from '../data/service';
import { MATERIAL_LABEL, type Material, type Product } from '../data/types';
import { todayThai } from '../format';

const MATERIAL_ORDER: Material[] = ['copper', 'brass', 'aluminium'];

const MATERIAL_EN: Record<Material, string> = {
  copper: 'Copper',
  brass: 'Brass',
  aluminium: 'Aluminium',
};

const HomePage = () => {
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
      <div className="hero">
        <h1>ราคารับซื้อโลหะวันนี้</h1>
        <p>ทองแดง · ทองเหลือง · อลูมิเนียม — สมาชิกที่ได้รับการอนุมัติสามารถจองราคาได้ที่เมนู "สินค้า"</p>
        <div className="pricedate">ประจำ{todayThai()}</div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!products && !error && <div className="empty-state">กำลังโหลดราคา…</div>}

      {products &&
        MATERIAL_ORDER.map((material) => {
          const group = products.filter((p) => p.material === material);
          if (group.length === 0) return null;
          return (
            <section key={material}>
              <div className="section-heading">
                <h2>{MATERIAL_LABEL[material]}</h2>
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
