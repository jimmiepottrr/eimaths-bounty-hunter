/** ข้อมูลบริษัท — เนื้อหาจำลอง (รอข้อมูลจริงจาก Jim มาแทนที่) รองรับ 3 ภาษา */

import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useT } from '../i18n';

const REG_NO = '0105554088000'; // เลขทะเบียนจำลอง

const STATS = [
  { num: '15+', key: 'company.statYears' },
  { num: '800+', key: 'company.statTons' },
  { num: '500+', key: 'company.statClients' },
];

const SERVICES = ['company.service1', 'company.service2', 'company.service3', 'company.service4'];

const CompanyPage = () => {
  const t = useT();
  return (
    <>
      <div className="company-hero">
        <Logo />
        <h1 style={{ margin: '16px 0 4px' }}>{t('company.title')}</h1>
        <p style={{ color: 'var(--ink-soft)', letterSpacing: '0.12em', margin: '0 0 6px' }}>
          COPPER 8000 CO., LTD.
        </p>
        <p style={{ color: 'var(--copper-dark)', fontWeight: 600, margin: 0 }}>{t('company.tagline')}</p>
      </div>

      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat" key={s.key}>
            <div className="num">{s.num}</div>
            <div className="lbl">{t(s.key)}</div>
          </div>
        ))}
      </div>

      <div className="company-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('company.aboutTitle')}</h3>
          <p style={{ lineHeight: 1.8, margin: 0 }}>{t('company.aboutBody')}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('company.visionTitle')}</h3>
          <p style={{ lineHeight: 1.8 }}>{t('company.visionBody')}</p>
          <h3>{t('company.regTitle')}</h3>
          <table className="reg-table">
            <tbody>
              <tr>
                <td className="k">{t('company.regNoLabel')}</td>
                <td>{REG_NO}</td>
              </tr>
              <tr>
                <td className="k">{t('company.regCapitalLabel')}</td>
                <td>{t('company.regCapitalValue')}</td>
              </tr>
              <tr>
                <td className="k">{t('company.foundedLabel')}</td>
                <td>{t('company.foundedValue')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t('company.servicesTitle')}</h3>
        <ul className="service-list">
          {SERVICES.map((key) => (
            <li key={key}>
              <span className="tick">✓</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="cta-box">
        <h3 style={{ marginTop: 0 }}>{t('company.ctaTitle')}</h3>
        <p style={{ color: 'var(--ink-soft)' }}>{t('company.ctaBody')}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup">
            <button type="button" className="btn btn-primary">
              {t('auth.signup')}
            </button>
          </Link>
          <Link to="/contact">
            <button type="button" className="btn btn-outline">
              {t('nav.contact')}
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default CompanyPage;
