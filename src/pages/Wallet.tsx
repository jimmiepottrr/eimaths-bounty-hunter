import React from 'react';
import { Link } from 'react-router-dom';
import { quests } from '../data';
import { useAppState } from '../store';

const Wallet: React.FC = () => {
  const { state, totalEarnedCoins } = useAppState();

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Coin wallet</p>
        <h1>กระเป๋าเหรียญของ {state.childName}</h1>
        <p>เหรียญจะเพิ่มจากผลคะแนนในภารกิจ และใช้แลกของรางวัลในร้านได้</p>
      </div>

      <div className="content-grid">
        <article className="wallet-balance">
          <span>ยอดคงเหลือ</span>
          <strong>{state.coins}</strong>
          <p>coins</p>
          <Link className="primary-button" to="/rewards">
            ไปแลกรางวัล
          </Link>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>สรุปเหรียญ</h2>
            <span>{totalEarnedCoins} coins earned</span>
          </div>
          <ul className="activity-list">
            {state.quizResults.length === 0 ? (
              <li>
                <span>ยังไม่มีรายการ</span>
                <strong>0</strong>
              </li>
            ) : (
              state.quizResults.map((result) => {
                const quest = quests.find((item) => item.id === result.questId);
                return (
                  <li key={`${result.questId}-${result.completedAt}`}>
                    <span>{quest?.title || 'ภารกิจคณิต'}</span>
                    <strong>+{result.earnedCoins}</strong>
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </div>
    </section>
  );
};

export default Wallet;
