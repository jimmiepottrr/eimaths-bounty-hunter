import React from 'react';
import { useNavigate } from 'react-router-dom';

// Grade selection page allows users to choose the appropriate difficulty
// or grade level for their child. In this demo it simply navigates
// to the home page once a grade is selected.
const Grade: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (grade: string) => {
    // In a real app we would store the selected grade in state or
    // send it to the server. For this demo we just navigate to home.
    navigate('/home');
  };

  const grades = ['อนุบาล 1', 'อนุบาล 2', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
  return (
    <div>
      <h1>เลือกระดับชั้น</h1>
      <p>เลือกระดับที่เหมาะสมสำหรับบุตรหลานของคุณ</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {grades.map((g) => (
          <li key={g} style={{ marginBottom: '0.5rem' }}>
            <button onClick={() => handleSelect(g)}>{g}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Grade;