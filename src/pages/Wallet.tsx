import React from 'react';
import { Link } from 'react-router-dom';
import { quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ScreenHeader, StatPill } from '../ui';

const Wallet: React.FC = () => {
  const { state, totalEarnedCoins, level } = useAppState();

  return (
    <AppScreen className="wallet-screen">
      <ScreenHeader title="Wallet" subtitle="Keep learning and earning coins!" showBack right={<span>⚙️</span>} />

      <div className="profile-card">
        <Mascot compact />
        <div>
          <h1>Hi, {state.childName || 'Hunter'}!</h1>
          <span>Level {level} ★</span>
        </div>
      </div>

      <article className="coin-card">
        <span>My Coins</span>
        <strong>🪙 {state.coins.toLocaleString()}</strong>
        <div className="wallet-stats">
          <StatPill icon="⭐" label="Total Earned" value={Math.max(totalEarnedCoins, state.exp)} />
          <StatPill icon="🎁" label="Total Spent" value={state.redeemedRewardIds.length * 500} />
        </div>
      </article>

      <article className="activity-card">
        <div className="section-title compact">
          <h2>Recent Activity</h2>
          <Link to="/parent-report">View All</Link>
        </div>
        <ul className="activity-list">
          {state.quizResults.length === 0 ? (
            <>
              <li><span>Completed Lesson</span><strong>+50 Today</strong></li>
              <li><span>Boss Battle Won</span><strong>+100 Yesterday</strong></li>
              <li><span>Daily Streak</span><strong>+75 Yesterday</strong></li>
            </>
          ) : (
            state.quizResults.map((result) => {
              const quest = quests.find((item) => item.id === result.questId);
              return (
                <li key={`${result.questId}-${result.completedAt}`}>
                  <span>{quest?.title || 'Math Quest'}</span>
                  <strong>+{result.earnedCoins}</strong>
                </li>
              );
            })
          )}
        </ul>
      </article>

      <Link className="primary-button wide" to="/rewards">
        Redeem Rewards
      </Link>
    </AppScreen>
  );
};

export default Wallet;
