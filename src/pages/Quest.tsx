import React from 'react';
import { Link } from 'react-router-dom';

// Quest page lists available missions or learning quests. In a
// production system these would be fetched from a server and
// include details like topics, difficulty and rewards. Here
// we display placeholder quests with links to a quiz.
const Quest: React.FC = () => {
  const quests = [
    { id: 1, title: 'ฝึกบวกเลขง่าย ๆ', description: 'ภารกิจบวกเลขสำหรับเด็กประถม' },
    { id: 2, title: 'ฝึกลบเลขพื้นฐาน', description: 'ภารกิจลบเลขสำหรับเด็กประถม' },
    { id: 3, title: 'โจทย์คูณง่าย ๆ', description: 'ภารกิจคูณเลขระดับเริ่มต้น' },
  ];
  return (
    <div>
      <h1>ภารกิจ</h1>
      <p>เลือกภารกิจที่ต้องการทำเพื่อสะสมเหรียญและพัฒนาทักษะทางคณิตศาสตร์</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {quests.map((q) => (
          <li key={q.id} style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '0.5rem' }}>
            <h3>{q.title}</h3>
            <p>{q.description}</p>
            <Link to="/quiz">เริ่มภารกิจ</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Quest;