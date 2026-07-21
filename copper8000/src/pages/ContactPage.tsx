/** ติดต่อบริษัท — ข้อมูลจำลอง + ลิงก์ Google Maps + แผนที่ (embed) */

import { useT } from '../i18n';

const MAP_QUERY = encodeURIComponent('Copper 8000 Co., Ltd. บางนา กรุงเทพมหานคร');
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
const MAP_EMBED = `https://maps.google.com/maps?q=${MAP_QUERY}&z=14&output=embed`;

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
                <a href="tel:020008000">02-000-8000</a> · <a href="tel:0818008000">081-800-8000</a>
              </span>
            </li>
            <li>
              <span className="k">LINE</span>
              <span>@copper8000</span>
            </li>
            <li>
              <span className="k">{t('contact.emailLabel')}</span>
              <span>
                <a href="mailto:contact@copper8000.co.th">contact@copper8000.co.th</a>
              </span>
            </li>
            <li>
              <span className="k">{t('contact.hoursLabel')}</span>
              <span style={{ whiteSpace: 'pre-line' }}>{t('contact.hoursValue')}</span>
            </li>
          </ul>
          <div style={{ marginTop: 20 }}>
            <a href={MAP_LINK} target="_blank" rel="noreferrer">
              <button type="button" className="btn btn-primary">
                {t('contact.openMaps')}
              </button>
            </a>
          </div>
        </div>

        <div>
          <iframe
            className="map-frame"
            title={t('contact.mapTitle')}
            src={MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>
            {t('contact.mapCaption')}{' '}
            <a href={MAP_LINK} target="_blank" rel="noreferrer">
              {t('contact.fullMap')}
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
