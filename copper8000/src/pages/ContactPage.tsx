/** ติดต่อบริษัท — ข้อมูลจำลอง + ลิงก์ Google Maps + แผนที่ (embed) */

const MAP_QUERY = encodeURIComponent('Copper 8000 Co., Ltd. บางนา กรุงเทพมหานคร');
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
const MAP_EMBED = `https://maps.google.com/maps?q=${MAP_QUERY}&z=14&output=embed`;

const ContactPage = () => (
  <>
    <div className="section-heading">
      <h2>ติดต่อบริษัท</h2>
      <span className="en">Contact Us</span>
    </div>

    <div className="contact-grid">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>บริษัท คอปเปอร์ 8000 จำกัด</h3>
        <ul className="contact-list">
          <li>
            <span className="k">ที่อยู่</span>
            <span>
              888/88 หมู่ 8 ถนนบางนา-ตราด กม.18
              <br />
              ตำบลบางโฉลง อำเภอบางพลี
              <br />
              จังหวัดสมุทรปราการ 10540
            </span>
          </li>
          <li>
            <span className="k">โทรศัพท์</span>
            <span>
              <a href="tel:020008000">02-000-8000</a> · <a href="tel:0818008000">081-800-8000</a>
            </span>
          </li>
          <li>
            <span className="k">LINE</span>
            <span>@copper8000</span>
          </li>
          <li>
            <span className="k">อีเมล</span>
            <span>
              <a href="mailto:contact@copper8000.co.th">contact@copper8000.co.th</a>
            </span>
          </li>
          <li>
            <span className="k">เวลาทำการ</span>
            <span>
              จันทร์–เสาร์ 8:00–17:30 น.
              <br />
              (หยุดวันอาทิตย์และวันหยุดนักขัตฤกษ์)
            </span>
          </li>
        </ul>
        <div style={{ marginTop: 20 }}>
          <a href={MAP_LINK} target="_blank" rel="noreferrer">
            <button type="button" className="btn btn-primary">
              เปิดใน Google Maps
            </button>
          </a>
        </div>
      </div>

      <div>
        <iframe
          className="map-frame"
          title="แผนที่บริษัท คอปเปอร์ 8000 จำกัด"
          src={MAP_EMBED}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>
          แผนที่ Google Maps —{' '}
          <a href={MAP_LINK} target="_blank" rel="noreferrer">
            เปิดแผนที่เต็มจอ
          </a>
        </p>
      </div>
    </div>
  </>
);

export default ContactPage;
