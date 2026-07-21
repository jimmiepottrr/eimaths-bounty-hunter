/**
 * แถวราคาหน้าแรก — ใช้ "สีจริงของโลหะ" ประจำกลุ่ม: แถวแรกเมทัลลิกเต็ม แถวถัดไปเฉดอ่อน
 * (2 เฉดต่อประเภทสินค้า) แสดงอย่างเดียว (ไม่มี onClick — จองไม่ได้จากหน้านี้)
 * สีชุดนี้คงที่ทุกธีมของเว็บ — เป็นสีของตัวสินค้า ไม่ใช่สีตกแต่ง
 */

import { fmtNumber } from '../format';
import { productName, productSubName, useI18n } from '../i18n';
import type { Material, Product } from '../data/types';

type RowStyle = { background: string; light: boolean };

/* satin metal: เลเยอร์ sheen ขาวจางด้านบน + ไล่สีโลหะแนวตั้ง — เรียบหรู ไม่เป็นริ้ว */
const sheen = 'linear-gradient(180deg, rgba(255, 255, 255, 0.30) 0%, rgba(255, 255, 255, 0) 55%)';

const METAL_ROWS: Record<Material, { strong: RowStyle; soft: RowStyle }> = {
  copper: {
    strong: {
      background: `${sheen}, linear-gradient(180deg, #c08a55 0%, #a76a3a 55%, #8a5628 100%)`,
      light: true,
    },
    soft: {
      background: `${sheen}, linear-gradient(180deg, #e8c8a6 0%, #d9a97c 100%)`,
      light: false,
    },
  },
  brass: {
    strong: {
      background: `${sheen}, linear-gradient(180deg, #dcbd58 0%, #c9a94f 50%, #a8862e 100%)`,
      light: false,
    },
    soft: {
      background: `${sheen}, linear-gradient(180deg, #efe0ab 0%, #ddc372 100%)`,
      light: false,
    },
  },
  aluminium: {
    strong: {
      background: `${sheen}, linear-gradient(180deg, #bcc4ca 0%, #98a0a7 55%, #7e868d 100%)`,
      light: true,
    },
    soft: {
      background: `${sheen}, linear-gradient(180deg, #e3e8eb 0%, #b7bfc6 100%)`,
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
