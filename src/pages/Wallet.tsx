import React, { useState } from 'react';

// Wallet page shows the current coin balance. For this demo we
// mock the coin balance and provide a simple button to "earn"
// coins to illustrate state updates. In a full application
// coin transactions would come from server-side APIs.
const Wallet: React.FC = () => {
  const [coins, setCoins] = useState<number>(100);

  const earnCoins = () => {
    setCoins((c) => c + 10);
  };

  return (
    <div>
      <h1>กระเป๋าเหรียญ</h1>
      <p>ยอดเหรียญคงเหลือ: {coins}</p>
      <button onClick={earnCoins}>รับเหรียญเพิ่ม 10</button>
    </div>
  );
};

export default Wallet;