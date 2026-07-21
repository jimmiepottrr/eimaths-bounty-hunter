/**
 * แถวราคาหน้าแรก — ไล่สีตามรูปอ้างอิง: ทองแดง metallic → ทองเหลืองอ่อน → ขาวนวล 3 ขั้น
 * แสดงอย่างเดียว (ไม่มี onClick — จองไม่ได้จากหน้านี้)
 */

import { fmtNumber } from '../format';
import { productName, productSubName, useI18n } from '../i18n';
import type { Product } from '../data/types';

/** ไล่เฉดตามลำดับแถวรวมทั้งบอร์ด (ตามรูป 1: เข้ม → อ่อน) */
const ROW_STYLES: { background: string; light: boolean }[] = [
  {
    background:
      'linear-gradient(90deg, #8a5628 0%, #c98d5c 18%, #a76a3a 40%, #d9a06a 62%, #a76a3a 82%, #8a5628 100%)',
    light: true,
  },
  {
    background:
      'linear-gradient(90deg, #c4b078 0%, #e8dcb4 22%, #d8c79a 45%, #efe5c2 68%, #d8c79a 88%, #c4b078 100%)',
    light: false,
  },
  { background: 'linear-gradient(90deg, #f2ecdd 0%, #f8f4ea 50%, #f5f1e6 100%)', light: false },
  { background: 'linear-gradient(90deg, #f7f3e9 0%, #fcf9f2 50%, #faf7f0 100%)', light: false },
  { background: 'linear-gradient(90deg, #fbf9f3 0%, #fefdfa 50%, #fdfcf8 100%)', light: false },
];

const PriceRow = ({ product, index, order }: { product: Product; index: number; order: number }) => {
  const { lang, t } = useI18n();
  const style = ROW_STYLES[Math.min(index, ROW_STYLES.length - 1)];
  return (
    <div className={`price-row ${style.light ? 'row-light' : 'row-dark'}`} style={{ background: style.background }}>
      <div>
        <h3 className="row-title">
          {order}. {productName(product, lang)}
        </h3>
        <span className="row-underline" />
        <div className="row-sub">{productSubName(product, lang)}</div>
      </div>
      <div className="row-price">
        {fmtNumber(product.price_per_kg)} <small>{t('unit.bahtPerKg')}</small>
      </div>
    </div>
  );
};

export default PriceRow;
