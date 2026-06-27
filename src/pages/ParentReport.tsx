import React from 'react';
import { useNavigate } from 'react-router-dom';
import { grades, quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader, StatPill } from '../ui';

const ParentReport: React.FC = () => {
  const navigate = useNavigate();
  const { state, accuracy, resetProgress, logout, level } = useAppState();
  const grade = grades.find((item) => item.id === state.gradeId);
  const completed = state.completedQuestIds.length;
  const lessons = Math.max(12, state.quizResults.length * 3);
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppScreen className="report-screen">
      <ScreenHeader title="Parent Report" subtitle="Track your child's progress and learning insights." showBack />

      <article className="report-hero">
        <div>
          <h1>{state.childName || 'Hunter'}</h1>
          <p>{grade?.label || 'Primary'} · Level {level}</p>
        </div>
        <Mascot compact />
      </article>

      <div className="date-chip">May 12 - May 18, 2026 📅</div>

      <article className="overview-card">
        <h2>This Week Overview</h2>
        <div className="report-stats">
          <StatPill icon="📘" label="Lessons" value={lessons} />
          <StatPill icon="🪙" label="Coins" value={state.coins.toLocaleString()} />
          <StatPill icon="⏱️" label="Study Time" value="4h 35m" />
          <StatPill icon="🔥" label="Streak" value={`${state.streak} days`} />
        </div>
      </article>

      <article className="performance-card">
        <div className="section-title compact">
          <h2>Subject Performance</h2>
          <span>View All</span>
        </div>
        {[
          ['Numbers', Math.max(85, accuracy)],
          ['Algebra', 70],
          ['Geometry', 78],
          ['Data & Graphs', 65],
        ].map(([label, value]) => (
          <div className="topic-row" key={label as string}>
            <span>{label}</span>
            <ProgressBar value={value as number} tone={(value as number) > 80 ? 'green' : 'blue'} />
            <strong>{value}%</strong>
          </div>
        ))}
      </article>

      <article className="overview-card">
        <h2>Next Goal</h2>
        <p>Complete {Math.max(0, quests.length - completed)} more quest(s) and improve accuracy in word problems.</p>
        <ProgressBar value={(completed / quests.length) * 100} tone="orange" />
      </article>

      <div className="profile-actions">
        <button className="outline-button wide" type="button" onClick={resetProgress}>
          Reset demo progress
        </button>
        <button className="logout-button wide" type="button" onClick={handleLogout}>
          <span aria-hidden="true">↪</span>
          Log out
        </button>
      </div>
    </AppScreen>
  );
};

export default ParentReport;
