import React from 'react';
import { Link } from 'react-router-dom';
import { quests } from '../data';
import { useAppState } from '../store';

const Quest: React.FC = () => {
  const { state } = useAppState();

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Quest board</p>
        <h1>เลือกภารกิจคณิต</h1>
        <p>ทำโจทย์ให้ครบ รับเหรียญ และปลดล็อกรายงานความก้าวหน้าของนักเรียน</p>
      </div>

      <div className="quest-grid">
        {quests.map((quest) => {
          const completed = state.completedQuestIds.includes(quest.id);
          return (
            <article className={`quest-card ${completed ? 'completed' : ''}`} key={quest.id}>
              <div className="quest-card-header">
                <span>{quest.topic}</span>
                <strong>{quest.reward} coins</strong>
              </div>
              <h2>{quest.title}</h2>
              <p>{quest.description}</p>
              <div className="quest-meta">
                <span>{quest.level}</span>
                <span>{quest.estimatedMinutes} นาที</span>
                <span>{quest.questionIds.length} ข้อ</span>
              </div>
              <Link className={completed ? 'secondary-button' : 'primary-button'} to={`/quiz/${quest.id}`}>
                {completed ? 'เล่นซ้ำ' : 'เริ่มภารกิจ'}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Quest;
