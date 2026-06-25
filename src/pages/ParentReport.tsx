import React from 'react';

// ParentReport page provides a summary of the child's progress
// to parents. Here we show static sample data, but in a real
// system this would render progress metrics, charts and
// recommendations based on the child's performance.
const ParentReport: React.FC = () => {
  return (
    <div>
      <h1>รายงานผู้ปกครอง</h1>
      <p>แสดงผลการเรียนรู้ของบุตรหลานของคุณ</p>
      <section style={{ marginTop: '1rem' }}>
        <h3>สถิติการทำภารกิจ</h3>
        <ul>
          <li>จำนวนภารกิจที่ทำสำเร็จ: 5</li>
          <li>คะแนนเฉลี่ย: 80%</li>
          <li>เหรียญที่ได้รับ: 150</li>
        </ul>
      </section>
      <section style={{ marginTop: '1rem' }}>
        <h3>ข้อเสนอแนะ</h3>
        <p>
          ลองให้เด็กทำภารกิจเรื่องคูณเลขเพิ่มเติมเพื่อเพิ่มทักษะด้านการคูณ
        </p>
      </section>
    </div>
  );
};

export default ParentReport;