/** ข้อมูลบริษัท — placeholder (Jim จะส่งเนื้อหาจริงมาใส่ภายหลัง) */

import Logo from '../components/Logo';
import { useT } from '../i18n';

const CompanyPage = () => {
  const t = useT();
  return (
    <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Logo />
      <h2 style={{ marginBottom: 8 }}>{t('company.title')}</h2>
      <p style={{ color: 'var(--ink-soft)' }}>COPPER 8000 CO., LTD.</p>
      <div className="info-box" style={{ maxWidth: 480, margin: '24px auto 0' }}>
        {t('company.comingSoon')}
      </div>
    </div>
  );
};

export default CompanyPage;
