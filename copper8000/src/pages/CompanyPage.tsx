/** ข้อมูลบริษัท — จัดรูปแบบให้ดูน่าเชื่อถือ · เนื้อหาอยู่ที่ src/data/companyContent.ts (3 ภาษา) */

import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { companyContent } from '../data/companyContent';
import { useI18n } from '../i18n';

const CompanyPage = () => {
  const { lang, t } = useI18n();
  const c = companyContent(lang);

  return (
    <>
      {/* หัวหน้า — โลโก้ + ชื่อบริษัท */}
      <div className="company-hero">
        <Logo />
        <h1 style={{ margin: '16px 0 4px' }}>{t('company.title')}</h1>
        <p style={{ color: 'var(--ink-soft)', letterSpacing: '0.12em', margin: '0 0 6px' }}>COPPER 8000 CO., LTD.</p>
        <p style={{ color: 'var(--copper-dark)', fontWeight: 600, margin: 0 }}>{t('company.tagline')}</p>
      </div>

      {/* เกี่ยวกับบริษัท */}
      <div className="card company-about">
        <div className="section-heading">
          <h2>{c.about.title}</h2>
          <span className="en">About Us</span>
        </div>
        {c.about.paragraphs.map((p, i) => (
          <p key={i} className="company-para">
            {p}
          </p>
        ))}
        <div className="company-closing">
          {c.about.closing.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* แนวคิด — CONNECT · VALUE · GROW */}
      <section className="company-section">
        <div className="section-heading">
          <h2>{c.concept.title}</h2>
          <span className="en">{c.concept.tagline}</span>
        </div>
        <div className="concept-grid">
          {c.concept.pillars.map((p, i) => (
            <div className="concept-pillar" key={p.key}>
              <div className="concept-no">{String(i + 1).padStart(2, '0')}</div>
              <div className="concept-key">{p.key}</div>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* วิสัยทัศน์ */}
      <div className="card vision-card">
        <div className="section-heading">
          <h2>{c.vision.title}</h2>
          <span className="en">Vision</span>
        </div>
        <blockquote className="vision-quote">{c.vision.quote}</blockquote>
        {c.vision.paragraphs.map((p, i) => (
          <p key={i} className="company-para">
            {p}
          </p>
        ))}
      </div>

      {/* พันธกิจ */}
      <section className="company-section">
        <div className="section-heading">
          <h2>{c.mission.title}</h2>
          <span className="en">Mission</span>
        </div>
        <div className="mission-grid">
          {c.mission.items.map((m, i) => (
            <div className="mission-item" key={i}>
              <span className="mission-check" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>{m.head}</strong>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* บริการของเรา */}
      <section className="company-section">
        <div className="section-heading">
          <h2>{c.services.title}</h2>
          <span className="en">Services</span>
        </div>
        <p className="company-para company-intro">{c.services.intro}</p>
        <div className="service-cards">
          {c.services.items.map((s, i) => (
            <div className="service-card" key={i}>
              <span className="service-tick" aria-hidden="true">
                ✓
              </span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* จุดเด่น — Why Copper 8000 */}
      <section className="company-section">
        <div className="section-heading">
          <h2>{c.why.title}</h2>
          <span className="en">Why Copper 8000?</span>
        </div>
        <div className="why-grid">
          {c.why.items.map((w) => (
            <div className="why-card" key={w.no}>
              <div className="why-no">{w.no}</div>
              <div className="why-en">{w.en}</div>
              <div className="why-th">{w.th}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
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
