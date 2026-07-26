/** Modal จองสินค้า — หน่วยเป็นกิโลกรัมเท่านั้น · จำนวนเริ่มว่าง
 *  2 สเต็ป: กรอกจำนวน → ตรวจสอบอีกครั้ง (double check) → ยืนยัน */

import { useEffect, useState } from 'react';
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
  const [quantityText, setQuantityText] = useState(''); // เริ่มว่าง ไม่ default เป็น 1
  const [step, setStep] = useState<'form' | 'review'>('form');

  // ราคาเปลี่ยนระหว่างเปิด modal (เช่นโดน 409) → เด้งกลับสเต็ปกรอกเพื่อให้ตรวจสอบราคาใหม่ก่อน
  useEffect(() => {
    setStep('form');
  }, [product.price_per_kg]);

  const quantity = Number(quantityText);
  const valid = Number.isFinite(quantity) && quantity > 0;
  const estimate = valid ? quantity * product.price_per_kg : 0; // กิโลกรัมเท่านั้น

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {step === 'form' ? (
          <>
            <h3>{t('booking.title', { name: productName(product, lang) })}</h3>
            <div className="m-price">{t('booking.todayPrice', { price: fmtNumber(product.price_per_kg) })}</div>

            <div className="field">
              <label htmlFor="qty">{t('booking.qtyKg')}</label>
              <input
                id="qty"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder={t('booking.qtyPlaceholder')}
                value={quantityText}
                onChange={(e) => setQuantityText(e.target.value)}
                autoFocus
              />
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
                disabled={!valid}
                onClick={() => setStep('review')}
              >
                {t('booking.next')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t('booking.reviewTitle')}</h3>
            <p className="m-review-note">{t('booking.reviewNote')}</p>

            <div className="review-list">
              <div className="review-row">
                <span>{t('booking.sumProduct')}</span>
                <strong>{productName(product, lang)}</strong>
              </div>
              <div className="review-row">
                <span>{t('booking.sumQty')}</span>
                <strong>
                  {fmtNumber(quantity)} {t('unit.kg')}
                </strong>
              </div>
              <div className="review-row">
                <span>{t('booking.sumPrice')}</span>
                <strong>
                  {fmtNumber(product.price_per_kg)} {t('unit.bahtPerKg')}
                </strong>
              </div>
              <div className="review-row total">
                <span>{t('booking.estimate')}</span>
                <strong>
                  {fmtNumber(estimate)} {t('unit.baht')}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setStep('form')} disabled={submitting}>
                {t('booking.back')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!valid || submitting}
                onClick={() => onConfirm(quantity, 'kg')}
              >
                {submitting ? t('booking.confirming') : t('booking.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
