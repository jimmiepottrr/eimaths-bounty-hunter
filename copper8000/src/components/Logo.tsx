/** โลโก้บริษัทตามไฟล์ต้นฉบับ (หกเหลี่ยม 3D ทองแดง + C8 + ชื่อบริษัท)
 *  เป็นภาพเดียวคงที่ ไม่สลับภาษา — ขนาดคุมด้วยคลาส .logo-img ใน CSS */

import logoUrl from '../assets/logo.webp';

const Logo = () => (
  <img
    src={logoUrl}
    className="logo-img"
    width={1890}
    height={560}
    alt="บริษัท คอปเปอร์ 8000 จำกัด — COPPER 8000 CO., LTD."
  />
);

export default Logo;
