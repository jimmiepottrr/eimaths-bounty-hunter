import React, { useEffect, useState } from 'react';
import { api, ApiError, RewardItem } from '../api';
import { useAppState } from '../store';
import { AppScreen, ScreenHeader } from '../ui';

/**
 * Reward Shop — แคตตาล็อก + การแลกมาจากเซิร์ฟเวอร์ทั้งหมด (ตัดเหรียญฝั่งเซิร์ฟเวอร์)
 */
const Rewards: React.FC = () => {
  const { player, syncCoins, playSound } = useAppState();
  const [catalog, setCatalog] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | number | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.rewardCatalog();
      setCatalog(result.rewards ?? result.catalog ?? []);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'โหลดของรางวัลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const handleRedeem = async (reward: RewardItem) => {
    if (redeemingId !== null) return; // กันกดรัว
    setRedeemingId(reward.id);
    setMessage('');
    try {
      const result = await api.rewardRedeem(reward.id);
      playSound('reward');
      setMessage(result.message ?? `แลก ${reward.name} สำเร็จ! 🎉`);
      if (typeof result.coins === 'number') {
        syncCoins(result.coins); // ยอดใหม่จากเซิร์ฟเวอร์ — client ไม่คำนวณเอง
      }
    } catch (caught) {
      playSound('error');
      setMessage(caught instanceof ApiError ? caught.message : 'แลกไม่สำเร็จ ลองใหม่อีกครั้งนะ');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <AppScreen className="reward-screen">
      <ScreenHeader
        title="ร้านของรางวัล"
        subtitle="ใช้เหรียญแลกส่วนลดคอร์ส/ของรางวัลที่สาขา"
        showBack
        right={<span className="coin-chip">🪙 {(player?.coins ?? 0).toLocaleString()}</span>}
      />

      {message && (
        <div className="message-box" role="status">
          <p>{message}</p>
        </div>
      )}

      {loading ? (
        <p className="reward-loading">กำลังเปิดร้าน… 🎁</p>
      ) : error ? (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <button className="outline-button" type="button" onClick={() => void loadCatalog()}>
            ลองใหม่
          </button>
        </div>
      ) : catalog.length === 0 ? (
        <p className="reward-loading">ยังไม่มีของรางวัลในซีซันนี้ — กลับมาดูใหม่เร็วๆ นี้นะ!</p>
      ) : (
        <div className="reward-grid">
          {catalog.map((reward) => {
            const affordable = (player?.coins ?? 0) >= reward.cost;
            return (
              <article className={`reward-card ${affordable ? '' : 'dim'}`} key={reward.id}>
                <span className="reward-icon">{reward.icon ?? '🎁'}</span>
                <h2>{reward.name}</h2>
                {reward.description && <p>{reward.description}</p>}
                <button
                  className="primary-button"
                  type="button"
                  disabled={!affordable || redeemingId !== null}
                  onClick={() => void handleRedeem(reward)}
                >
                  {redeemingId === reward.id ? 'กำลังแลก…' : `🪙 ${reward.cost.toLocaleString()}`}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </AppScreen>
  );
};

export default Rewards;
