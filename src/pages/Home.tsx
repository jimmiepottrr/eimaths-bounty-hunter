import React from 'react';
import { Link } from 'react-router-dom';
import { grades, quests, rewards } from '../data';
import { useAppState } from '../store';

const Home: React.FC = () => {
  const { state, accuracy, totalEarnedCoins } = useAppState();
  const grade = grades.find((item) => item.id === state.gradeId);
  const nextQuest = quests.find((quest) => !state.completedQuestIds.includes(quest.id)) || quests[0];
  const affordableRewards = rewards.filter((reward) => reward.cost <= state.coins).length;

  return (
    <section className="page-stack">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Today mission</p>
          <h1>พร้อมล่าโจทย์แล้ว {state.childName}</h1>
          <p>
            ระดับ {grade?.label || 'ป.1'} · {state.completedQuestIds.length}/{quests.length} ภารกิจสำเร็จ
          </p>
        </div>
        <Link className="primary-button" to={`/quiz/${nextQuest.id}`}>
          เล่นภารกิจถัดไป
        </Link>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>เหรียญคงเหลือ</span>
          <strong>{state.coins}</strong>
          <small>ใช้แลกของรางวัลได้ทันที</small>
        </article>
        <article className="metric-card">
          <span>ความแม่นยำ</span>
          <strong>{accuracy}%</strong>
          <small>คำนวณจากประวัติการตอบ</small>
        </article>
        <article className="metric-card">
          <span>เหรียญที่หาได้</span>
          <strong>{totalEarnedCoins}</strong>
          <small>จากภารกิจที่ทำไปแล้ว</small>
        </article>
        <article className="metric-card">
          <span>รางวัลที่แลกได้</span>
          <strong>{affordableRewards}</strong>
          <small>ตามยอดเหรียญปัจจุบัน</small>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="section-title">
            <h2>ภารกิจแนะนำ</h2>
            <Link to="/quest">ดูทั้งหมด</Link>
          </div>
          <div className="quest-preview">
            <div>
              <strong>{nextQuest.title}</strong>
              <p>{nextQuest.description}</p>
            </div>
            <span>{nextQuest.reward} coins</span>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>กิจกรรมล่าสุด</h2>
            <Link to="/parent-report">รายงาน</Link>
          </div>
          {state.quizResults.length === 0 ? (
            <p className="muted">ยังไม่มีประวัติ เริ่มภารกิจแรกเพื่อสร้างรายงาน</p>
          ) : (
            <ul className="activity-list">
              {state.quizResults.slice(0, 3).map((result) => {
                const quest = quests.find((item) => item.id === result.questId);
                return (
                  <li key={`${result.questId}-${result.completedAt}`}>
                    <span>{quest?.title}</span>
                    <strong>{result.score}/{result.total}</strong>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
};

export default Home;
