import React from 'react';
import { Link } from 'react-router-dom';
import { quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader } from '../ui';

const Quest: React.FC = () => {
  const { state } = useAppState();

  return (
    <AppScreen className="quest-screen">
      <ScreenHeader title="Today's Missions" subtitle="Check quests, build your streak, and claim rewards." showBack />

      <div className="streak-card">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <span key={day} className={index < Math.min(state.streak, 7) ? 'done' : ''}>
            {index < Math.min(state.streak, 7) ? '✓' : index + 1}
            <small>{day}</small>
          </span>
        ))}
      </div>

      <div className="mission-list">
        {quests.map((quest) => {
          const completed = state.completedQuestIds.includes(quest.id);
          return (
            <article className={`mission-card ${completed ? 'completed' : ''}`} key={quest.id}>
              <span className="mission-icon">{quest.icon}</span>
              <div>
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <ProgressBar value={completed ? 100 : 34} tone={completed ? 'green' : 'blue'} />
              </div>
              <div className="reward-badge">
                <small>Rewards</small>
                <strong>🪙 {quest.reward}</strong>
              </div>
              <Link to={`/quiz/${quest.id}`}>{completed ? 'Replay' : 'Start'}</Link>
            </article>
          );
        })}
      </div>

      <div className="claim-card">
        <button className="primary-button wide" type="button">
          Claim All Rewards!
        </button>
        <Mascot compact />
      </div>
    </AppScreen>
  );
};

export default Quest;
