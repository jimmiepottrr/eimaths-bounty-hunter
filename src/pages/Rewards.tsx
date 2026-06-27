import React, { useState } from 'react';
import { rewards } from '../data';
import { useAppState } from '../store';
import { AppScreen, ScreenHeader } from '../ui';

const Rewards: React.FC = () => {
  const { state, redeemReward } = useAppState();
  const [message, setMessage] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState(rewards[2]?.id || rewards[0].id);
  const selectedReward = rewards.find((reward) => reward.id === selectedRewardId) || rewards[0];

  const handleRedeem = (rewardId: string) => {
    const result = redeemReward(rewardId);
    setMessage(result.message);
  };

  return (
    <AppScreen className="reward-screen">
      <ScreenHeader
        title="Reward Shop"
        subtitle="Redeem coins for discounts on your next course."
        showBack
        right={<span className="coin-chip">🪙 {state.coins.toLocaleString()}</span>}
      />

      <div className="shop-hero">
        <div>
          <h1>Course Discount Coupons</h1>
          <p>Choose a coupon and redeem it with your coins.</p>
        </div>
      </div>

      {message && <p className="toast-message">{message}</p>}

      <div className="coupon-list">
        {rewards.map((reward) => {
          const redeemed = state.redeemedRewardIds.includes(reward.id);
          const affordable = state.coins >= reward.cost;
          return (
            <button
              className={`coupon-row ${selectedRewardId === reward.id ? 'selected' : ''}`}
              key={reward.id}
              type="button"
              onClick={() => setSelectedRewardId(reward.id)}
            >
              <span>{reward.icon}</span>
              <div>
                <strong>{reward.name}</strong>
                <small>{reward.cost.toLocaleString()} coins</small>
              </div>
              <em>{redeemed ? 'Used' : affordable ? `🪙 ${reward.cost}` : 'Locked'}</em>
            </button>
          );
        })}
      </div>

      <article className="redeem-card">
        <span>Selected Coupon</span>
        <div className="coupon-ticket">
          <strong>{selectedReward.value || selectedReward.name} OFF</strong>
          <small>Next Course Discount 🎓</small>
        </div>
        <ul>
          <li>🪙 {selectedReward.cost.toLocaleString()} coins</li>
          <li>⏱ Valid for 60 days</li>
          <li>✅ One-time use</li>
        </ul>
        <button
          className="primary-button wide"
          type="button"
          disabled={state.redeemedRewardIds.includes(selectedReward.id)}
          onClick={() => handleRedeem(selectedReward.id)}
        >
          Redeem Now
        </button>
      </article>
    </AppScreen>
  );
};

export default Rewards;
