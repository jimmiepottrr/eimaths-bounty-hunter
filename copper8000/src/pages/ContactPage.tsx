/** ติดต่อบริษัท — ข้อมูลติดต่อ (โทร/LINE/อีเมล/เวลาทำการ) */

import { EMAIL, LINE_ID, LINE_URL, PHONES } from '../contactInfo';
import { useT } from '../i18n';

const ContactPage = () => {
  const t = useT();
  return (
    <>
      <div className="section-heading">
        <h2>{t('nav.contact')}</h2>
        <span className="en">Contact Us</span>
      </div>

      <div className="contact-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t('company.title')}</h3>
          <ul className="contact-list">
            <li>
              <span className="k">{t('contact.addressLabel')}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{t('contact.addressValue')}</span>
            </li>
            <li>
              <span className="k">{t('contact.phoneLabel')}</span>
              <span>
                {PHONES.map((p, i) => (
                  <span key={p.tel}>
                    {i > 0 && ' · '}
                    <a href={`tel:${p.tel}`}>{p.label}</a>
                  </span>
                ))}
              </span>
            </li>
            <li>
              <span className="k">LINE</span>
              <span>
                <a href={LINE_URL} target="_blank" rel="noreferrer">
                  {LINE_ID}
                </a>
              </span>
            </li>
            <li>
              <span className="k">{t('contact.emailLabel')}</span>
              <span>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </span>
            </li>
            <li>
              <span className="k">{t('contact.hoursLabel')}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{t('contact.hoursValue')}</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
