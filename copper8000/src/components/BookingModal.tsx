/** Modal จองสินค้า — กรอกจำนวน + เลือกหน่วย กก./ตัน (default ตัน) + ยอดประมาณการ */

import { useState } from 'react';
import { fmtNumber } from '../format';
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
  const [quantityText, setQuantityText] = useState('1');
  const [unit, setUnit] = useState<Unit>('ton'); // default ตัน ตามสเปก

  const quantity = Number(quantityText);
  const valid = Number.isFinite(quantity) && quantity > 0;
  const estimate = valid ? quantity * (unit === 'ton' ? 1000 : 1) * product.price_per_kg : 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>จอง — {product.name_th}</h3>
        <div className="m-price">ราคารับซื้อวันนี้ {fmtNumber(product.price_per_kg)} บาท/กก.</div>

        <div className="field">
          <label htmlFor="qty">จำนวนที่ต้องการจอง</label>
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
          <label>หน่วย</label>
          <div className="unit-choice">
            <label className={unit === 'ton' ? 'selected' : ''}>
              <input type="radio" name="unit" checked={unit === 'ton'} onChange={() => setUnit('ton')} />
              ตัน
            </label>
            <label className={unit === 'kg' ? 'selected' : ''}>
              <input type="radio" name="unit" checked={unit === 'kg'} onChange={() => setUnit('kg')} />
              กิโลกรัม
            </label>
          </div>
        </div>

        <div className="estimate">
          <span>ยอดประมาณการ</span>
          <span>{fmtNumber(estimate)} บาท</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || submitting}
            onClick={() => onConfirm(quantity, unit)}
          >
            {submitting ? 'กำลังจอง…' : 'ยืนยันการจอง'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
