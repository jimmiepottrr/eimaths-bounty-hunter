import React from 'react';
import { useNavigate } from 'react-router-dom';
import { grades } from '../data';
import { useAppState } from '../store';

const Grade: React.FC = () => {
  const navigate = useNavigate();
  const { state, selectGrade } = useAppState();

  const handleSelect = (gradeId: string) => {
    selectGrade(gradeId);
    navigate('/home');
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Profile setup</p>
        <h1>เลือกระดับชั้นของ {state.childName}</h1>
        <p>ระบบจะใช้ระดับชั้นนี้เพื่อแนะนำภารกิจและคำแนะนำในรายงานผู้ปกครอง</p>
      </div>

      <div className="grade-grid">
        {grades.map((grade) => (
          <button
            className={`grade-card ${state.gradeId === grade.id ? 'selected' : ''}`}
            key={grade.id}
            type="button"
            onClick={() => handleSelect(grade.id)}
          >
            <strong>{grade.label}</strong>
            <span>{grade.range}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default Grade;
