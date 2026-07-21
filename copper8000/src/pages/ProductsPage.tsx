/**
 * เมนูสินค้า — สไตล์แอปเทรด: แตะสินค้าเพื่อจอง
 * ยังไม่ login → พาไปหน้า login · login แล้วแต่ยังไม่ approved → แจ้งเตือน จองไม่ได้
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import ProductRow from '../components/ProductRow';
import { dataService } from '../data/service';
import { MATERIAL_LABEL, type Material, type Product, type Unit } from '../data/types';
import { useAuth } from '../store';

const MATERIAL_ORDER: Material[] = ['copper', 'brass', 'aluminium'];

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    dataService
      .listProducts()
      .then(setProducts)
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const hint = !user
    ? 'เข้าสู่ระบบเพื่อจอง'
    : user.approved
      ? 'แตะเพื่อจอง'
      : 'บัญชีรอการอนุมัติ — ยังจองไม่ได้';

  const handleTap = (product: Product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.approved) {
      setToast('บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากแอดมิน จึงยังจองไม่ได้');
      return;
    }
    setSelected(product);
  };

  const handleConfirm = async (quantity: number, unit: Unit) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await dataService.createBooking({ product_id: selected.id, quantity, unit });
      setSelected(null);
      navigate('/booking-report');
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="section-heading">
        <h2>สินค้า — ราคารับซื้อ</h2>
        <span className="en">Touch to Book</span>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!products && !error && <div className="empty-state">กำลังโหลดสินค้า…</div>}

      {products &&
        MATERIAL_ORDER.map((material) => {
          const group = products.filter((p) => p.material === material);
          if (group.length === 0) return null;
          return (
            <section key={material} style={{ marginBottom: 28 }}>
              <h3 style={{ margin: '18px 0 10px' }}>{MATERIAL_LABEL[material]}</h3>
              <div className="trade-board">
                {group.map((p) => (
                  <ProductRow key={p.id} product={p} hint={hint} onClick={() => handleTap(p)} />
                ))}
              </div>
            </section>
          );
        })}

      {selected && (
        <BookingModal
          product={selected}
          submitting={submitting}
          onConfirm={handleConfirm}
          onClose={() => setSelected(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

export default ProductsPage;
