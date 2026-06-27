import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { grades } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ScreenHeader } from '../ui';

const Grade: React.FC = () => {
  const navigate = useNavigate();
  const { state, selectGrade } = useAppState();

  const handleSelect = (gradeId: string) => {
    selectGrade(gradeId);
    navigate('/home');
  };

  return (
    <AppScreen className="map-bg">
      <ScreenHeader title="Choose Your Grade" subtitle="Pick your grade to start your math adventure!" showBack />
      <div className="peek-mascot">
        <Mascot mood="happy" variant="journey" />
      </div>
      <div className="grade-list">
        {grades.map((grade, index) => (
          <button
            className={`grade-card ${state.gradeId === grade.id ? 'selected' : ''} tone-${index + 1}`}
            key={grade.id}
            type="button"
            onClick={() => handleSelect(grade.id)}
          >
            <strong>{grade.shortLabel}</strong>
            <span>
              <b>{grade.label}</b>
              <small>{grade.range}</small>
            </span>
            <em>{grade.scene === 'island' ? '🏝️' : grade.scene === 'temple' ? '🏜️' : '🏛️'}</em>
          </button>
        ))}
      </div>
      <article className="grade-story-panel">
        <div className="grade-story-copy">
          <span>Your journey</span>
          <h2>Six worlds. One legendary treasure.</h2>
          <p>Choose your grade, then follow the island trail from Addition Island to Algebra Castle.</p>
          <div className="grade-story-stats">
            <b>6 worlds</b>
            <b>3 quests ready</b>
            <b>Rewards in every stage</b>
          </div>
          <Link className="primary-button" to="/map">Open Adventure Map</Link>
          <Link className="story-replay-link" to="/intro">Replay opening story</Link>
        </div>
      </article>
    </AppScreen>
  );
};

export default Grade;
