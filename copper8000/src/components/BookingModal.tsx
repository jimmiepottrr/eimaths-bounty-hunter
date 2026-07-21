/** Modal จองสินค้า — กรอกจำนวน + เลือกหน่วย กก./ตัน (default ตัน) + ยอดประมาณการ */

import { useState } from 'react';
import { fmtNumber } from '../format';
import { productName, useI18n } from '../i18n';
import type { Product, Unit } from '../data/types';

const BookingModal = ({
  product,
  submitting,
  onConfirm,
  onClose,
}: {
  product: Product;
  submitting: boolean;
  onConfirm: (quantity: number, unit: Unit) => void;
  onClose: () => void;
}) => {
  const { lang, t } = useI18n();
  const [quantityText, setQuantityText] = useState('1');
  const [unit, setUnit] = useState<Unit>('ton'); // default ตัน ตามสเปก

  const quantity = Number(quantityText);
  const valid = Number.isFinite(quantity) && quantity > 0;
  const estimate = valid ? quantity * (unit === 'ton' ? 1000 : 1) * product.price_per_kg : 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{t('booking.title', { name: productName(product, lang) })}</h3>
        <div className="m-price">{t('booking.todayPrice', { price: fmtNumber(product.price_per_kg) })}</div>

        <div className="field">
          <label htmlFor="qty">{t('booking.qty')}</label>
          <input
            id="qty"
            type="number"
            min="0"
            step="any"
            value={quantityText}
            onChange={(e) => setQuantityText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label>{t('booking.unit')}</label>
          <div className="unit-choice">
            <label className={unit === 'ton' ? 'selected' : ''}>
              <input type="radio" name="unit" checked={unit === 'ton'} onChange={() => setUnit('ton')} />
              {t('unit.ton')}
            </label>
            <label className={unit === 'kg' ? 'selected' : ''}>
              <input type="radio" name="unit" checked={unit === 'kg'} onChange={() => setUnit('kg')} />
              {t('unit.kg')}
            </label>
          </div>
        </div>

        <div className="estimate">
          <span>{t('booking.estimate')}</span>
          <span>
            {fmtNumber(estimate)} {t('unit.baht')}
          </span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {t('booking.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || submitting}
            onClick={() => onConfirm(quantity, unit)}
          >
            {submitting ? t('booking.confirming') : t('booking.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
