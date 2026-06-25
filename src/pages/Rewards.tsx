import React from 'react';

// Rewards page lists items that users can redeem with their coins.
// In this mock version we just display static items. A real
// implementation would fetch these from a backend and handle
// redemption logic.
const Rewards: React.FC = () => {
  const rewards = [
    { id: 1, name: 'สมุดระบายสี', cost: 50 },
    { id: 2, name: 'ดินสอชุดใหญ่', cost: 100 },
    { id: 3, name: 'ของเล่นตัวต่อ', cost: 200 },
  ];

  return (
    <div>
      <h1>ของรางวัล</h1>
      <p>ใช้เหรียญสะสมแลกของรางวัลพิเศษ</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rewards.map((r) => (
          <li key={r.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '0.5rem' }}>
            <strong>{r.name}</strong>
            <p>ราคา {r.cost} เหรียญ</p>
            <button disabled>แลกของรางวัล (ตัวอย่าง)</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rewards;