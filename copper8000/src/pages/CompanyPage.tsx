/** ข้อมูลบริษัท — placeholder (Jim จะส่งเนื้อหาจริงมาใส่ภายหลัง) */

import Logo from '../components/Logo';

const CompanyPage = () => (
  <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
    <Logo />
    <h2 style={{ marginBottom: 8 }}>บริษัท คอปเปอร์ 8000 จำกัด</h2>
    <p style={{ color: 'var(--ink-soft)' }}>COPPER 8000 CO., LTD.</p>
    <div className="info-box" style={{ maxWidth: 480, margin: '24px auto 0' }}>
      เนื้อหาส่วนข้อมูลบริษัทจะเพิ่มเติมเร็ว ๆ นี้
    </div>
  </div>
);

export default CompanyPage;
