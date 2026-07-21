/** แถวสินค้าสไตล์แอปเทรด: ราคาใหญ่เขียว/แดงเทียบราคาก่อนหน้า + High/Low + แตะเพื่อจอง */

import { fmtDateTime, fmtNumber } from '../format';
import { productName, productSubName, useI18n } from '../i18n';
import type { Product } from '../data/types';

const ProductRow = ({
  product,
  hint,
  onClick,
}: {
  product: Product;
  hint: string;
  onClick: () => void;
}) => {
  const { lang, t } = useI18n();
  const diff = product.price_per_kg - product.prev_price_per_kg;
  const dirClass = diff > 0 ? 't-up' : diff < 0 ? 't-down' : '';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '—';
  const sub = productSubName(product, lang);

  return (
    <button type="button" className="trade-row" onClick={onClick}>
      <div>
        <div className="t-name">{productName(product, lang)}</div>
        <div className="t-sub">
          {sub ? `${sub} · ` : ''}
          {t('row.updated', { time: fmtDateTime(product.updated_at) })}
        </div>
      </div>
      <div>
        <div className={`t-price ${dirClass}`}>{fmtNumber(product.price_per_kg)}</div>
        <div className={`t-delta ${dirClass}`}>
          {arrow} {diff === 0 ? t('row.flat') : t('row.delta', { n: fmtNumber(Math.abs(diff)) })}
        </div>
      </div>
      <div className="t-hl">
        High: {fmtNumber(product.high_of_day)}
        <br />
        Low: {fmtNumber(product.low_of_day)}
      </div>
      <div className="t-hint">{hint}</div>
    </button>
  );
};

export default ProductRow;
