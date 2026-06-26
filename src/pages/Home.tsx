import React from 'react';
import { Link } from 'react-router-dom';
import { grades, quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader, StatPill } from '../ui';

const Home: React.FC = () => {
  const { state, level } = useAppState();
  const grade = grades.find((item) => item.id === state.gradeId);
  const completedCount = state.completedQuestIds.length;
  const nextQuest = quests.find((quest) => !state.completedQuestIds.includes(quest.id)) || quests[0];
  const dailyProgress = Math.min(100, Math.round((completedCount / quests.length) * 100));
  const expProgress = state.exp % 500;

  return (
    <AppScreen className="home-screen">
      <div className="blue-hero">
        <ScreenHeader
          title={`Hi, ${state.childName || 'Hunter'}!`}
          subtitle="Ready for today's adventure?"
          right={<span className="bell">🔔</span>}
        />
        <div className="stat-strip">
          <StatPill icon="🪙" label="Coins" value={state.coins.toLocaleString()} />
          <StatPill icon="⭐" label="EXP" value={state.exp.toLocaleString()} />
          <StatPill icon="🔥" label="Streak" value={`${state.streak} days`} />
        </div>
      </div>

      <article className="daily-card">
        <div>
          <span className="scroll-icon">📜</span>
          <h2>Daily Quest</h2>
          <p>Solve 3 math missions in {grade?.label || 'your grade'}</p>
          <ProgressBar value={dailyProgress} tone="gold" />
          <small>{completedCount}/{quests.length}</small>
        </div>
        <strong>+150</strong>
      </article>

      <div className="coach-card">
        <Mascot compact />
        <p>Great job! Keep it up and earn more rewards.</p>
      </div>

      <article className="progress-card">
        <div className="section-title compact">
          <h2>Your Progress</h2>
          <span>Level {level}</span>
        </div>
        <ProgressBar value={(expProgress / 500) * 100} />
        <small>{expProgress}/500 EXP</small>
      </article>

      <div className="action-grid">
        <Link to="/grade">🗺️<span>Map</span></Link>
        <Link to="/quest">📋<span>Quest</span></Link>
        <Link to={`/quiz/${nextQuest.id}`}>👾<span>Boss</span></Link>
        <Link to="/rewards">🎁<span>Rewards</span></Link>
        <Link to="/parent-report">👤<span>Profile</span></Link>
      </div>
    </AppScreen>
  );
};

export default Home;
