/**
 * แถวราคาหน้าแรก — ใช้ "สีจริงของโลหะ" ประจำกลุ่ม: แถวแรกเมทัลลิกเต็ม แถวถัดไปเฉดอ่อน
 * (2 เฉดต่อประเภทสินค้า) แสดงอย่างเดียว (ไม่มี onClick — จองไม่ได้จากหน้านี้)
 * สีชุดนี้คงที่ทุกธีมของเว็บ — เป็นสีของตัวสินค้า ไม่ใช่สีตกแต่ง
 */

import { fmtNumber } from '../format';
import { productName, productSubName, useI18n } from '../i18n';
import type { Material, Product } from '../data/types';

type RowStyle = { background: string; light: boolean };

const METAL_ROWS: Record<Material, { strong: RowStyle; soft: RowStyle }> = {
  copper: {
    strong: {
      background:
        'linear-gradient(90deg, #8a5628 0%, #c98d5c 18%, #a76a3a 40%, #d9a06a 62%, #a76a3a 82%, #8a5628 100%)',
      light: true,
    },
    soft: {
      background: 'linear-gradient(90deg, #d9a97c 0%, #eed3b8 50%, #d9a97c 100%)',
      light: false,
    },
  },
  brass: {
    strong: {
      background:
        'linear-gradient(90deg, #a8862e 0%, #e8d492 22%, #c9a94f 45%, #eeda9a 68%, #c9a94f 88%, #a8862e 100%)',
      light: false,
    },
    soft: {
      background: 'linear-gradient(90deg, #ddc372 0%, #f0e2b4 50%, #ddc372 100%)',
      light: false,
    },
  },
  aluminium: {
    strong: {
      background:
        'linear-gradient(90deg, #7e868d 0%, #c3c9ce 20%, #98a0a7 45%, #d7dcdf 70%, #98a0a7 88%, #7e868d 100%)',
      light: true,
    },
    soft: {
      background: 'linear-gradient(90deg, #b7bfc6 0%, #dde2e6 50%, #b7bfc6 100%)',
      light: false,
    },
  },
};

const PriceRow = ({ product, index, order }: { product: Product; index: number; order: number }) => {
  const { lang, t } = useI18n();
  const style = index === 0 ? METAL_ROWS[product.material].strong : METAL_ROWS[product.material].soft;
  const sub = productSubName(product, lang);
  return (
    <div className={`price-row ${style.light ? 'row-light' : 'row-dark'}`} style={{ background: style.background }}>
      <div>
        <h3 className="row-title">
          {order}. {productName(product, lang)}
        </h3>
        <span className="row-underline" />
        {sub && <div className="row-sub">{sub}</div>}
      </div>
      <div className="row-price">
        {fmtNumber(product.price_per_kg)} <small>{t('unit.bahtPerKg')}</small>
      </div>
    </div>
  );
};

export default PriceRow;
