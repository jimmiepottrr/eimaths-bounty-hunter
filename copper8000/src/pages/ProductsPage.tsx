/**
 * เมนูสินค้า — สไตล์แอปเทรด: แตะสินค้าเพื่อจอง
 * ยังไม่ login → พาไปหน้า login · login แล้วแต่ยังไม่ approved → แจ้งเตือน จองไม่ได้
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import ProductRow from '../components/ProductRow';
import { dataService } from '../data/service';
import type { Material, Product, Unit } from '../data/types';
import { useT } from '../i18n';
import { useAuth } from '../store';

const MATERIAL_ORDER: Material[] = ['copper', 'brass', 'aluminium'];

const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useT();
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
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const hint = !user
    ? t('products.hintLogin')
    : user.approved
      ? t('products.hintTap')
      : t('products.hintWaiting');

  const handleTap = (product: Product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.approved) {
      setToast(t('products.toastWaiting'));
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
        <h2>{t('products.heading')}</h2>
        <span className="en">Touch to Book</span>
      </div>

      {error && <div className="error-box">{error}</div>}
      {!products && !error && <div className="empty-state">{t('products.loading')}</div>}

      {products &&
        MATERIAL_ORDER.map((material) => {
          const group = products.filter((p) => p.material === material);
          if (group.length === 0) return null;
          return (
            <section key={material} style={{ marginBottom: 28 }}>
              <h3 style={{ margin: '18px 0 10px' }}>{t(`material.${material}`)}</h3>
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
