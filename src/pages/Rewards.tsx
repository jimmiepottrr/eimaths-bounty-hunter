import React, { useState } from 'react';
import { rewards } from '../data';
import { useAppState } from '../store';

const Rewards: React.FC = () => {
  const { state, redeemReward } = useAppState();
  const [message, setMessage] = useState('');

  const handleRedeem = (rewardId: string) => {
    const result = redeemReward(rewardId);
    setMessage(result.message);
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Reward shop</p>
        <h1>ร้านของรางวัล</h1>
        <p>ใช้เหรียญที่ได้จากการฝึกคณิตแลกสิทธิพิเศษและของสะสม</p>
      </div>

      <div className="wallet-strip">
        <strong>{state.coins} coins</strong>
        <span>{state.redeemedRewardIds.length} rewards redeemed</span>
      </div>

      {message && <p className="toast-message">{message}</p>}

      <div className="reward-grid">
        {rewards.map((reward) => {
          const redeemed = state.redeemedRewardIds.includes(reward.id);
          const affordable = state.coins >= reward.cost;
          return (
            <article className={`reward-card ${redeemed ? 'redeemed' : ''}`} key={reward.id}>
              <span>{reward.category}</span>
              <h2>{reward.name}</h2>
              <p>{reward.description}</p>
              <div className="reward-footer">
                <strong>{reward.cost} coins</strong>
                <button
                  className={affordable && !redeemed ? 'primary-button' : 'secondary-button'}
                  type="button"
                  disabled={redeemed}
                  onClick={() => handleRedeem(reward.id)}
                >
                  {redeemed ? 'แลกแล้ว' : affordable ? 'แลกเลย' : 'เหรียญไม่พอ'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Rewards;
