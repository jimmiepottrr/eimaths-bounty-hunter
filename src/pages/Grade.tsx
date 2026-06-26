import React from 'react';
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
        <Mascot mood="happy" />
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
    </AppScreen>
  );
};

export default Grade;
