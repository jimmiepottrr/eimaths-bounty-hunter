import React from 'react';
import { grades, quests } from '../data';
import { useAppState } from '../store';

const ParentReport: React.FC = () => {
  const { state, accuracy, resetProgress } = useAppState();
  const grade = grades.find((item) => item.id === state.gradeId);
  const completed = state.completedQuestIds.length;
  const latestResult = state.quizResults[0];
  const nextQuest = quests.find((quest) => !state.completedQuestIds.includes(quest.id));
  const recommendation =
    accuracy >= 85
      ? 'ผลลัพธ์ดีมาก สามารถเพิ่มภารกิจระดับท้าทายหรือโจทย์จับเวลาได้'
      : accuracy >= 60
        ? 'ควรฝึกซ้ำในข้อที่ตอบพลาด และให้เด็กอธิบายวิธีคิดด้วยคำพูดของตัวเอง'
        : 'แนะนำให้เริ่มจากภารกิจบวก-ลบพื้นฐาน พร้อมใช้ภาพหรือของจริงช่วยนับ';

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Parent report</p>
        <h1>รายงานของ {state.childName}</h1>
        <p>
          ผู้ปกครอง: {state.parentName} · ระดับ {grade?.label || 'ไม่ระบุ'} · เป้าหมาย {grade?.range}
        </p>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>ภารกิจสำเร็จ</span>
          <strong>{completed}/{quests.length}</strong>
          <small>นับภารกิจที่เคยผ่านอย่างน้อย 1 ครั้ง</small>
        </article>
        <article className="metric-card">
          <span>ความแม่นยำรวม</span>
          <strong>{accuracy}%</strong>
          <small>จากคำตอบทั้งหมดในเครื่องนี้</small>
        </article>
        <article className="metric-card">
          <span>Streak</span>
          <strong>{state.streak}</strong>
          <small>จำนวนรอบที่ทำคะแนนได้ต่อเนื่อง</small>
        </article>
        <article className="metric-card">
          <span>รางวัลที่แลก</span>
          <strong>{state.redeemedRewardIds.length}</strong>
          <small>ช่วยสะท้อนแรงจูงใจ</small>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel">
          <div className="section-title">
            <h2>คำแนะนำ</h2>
          </div>
          <p>{recommendation}</p>
          {nextQuest ? (
            <p className="muted">ภารกิจถัดไปที่เหมาะสม: {nextQuest.title}</p>
          ) : (
            <p className="muted">ทำครบทุกภารกิจแล้ว เหมาะสำหรับเล่นซ้ำเพื่อเพิ่มความเร็ว</p>
          )}
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>ผลล่าสุด</h2>
          </div>
          {latestResult ? (
            <div className="latest-result">
              <strong>{latestResult.score}/{latestResult.total}</strong>
              <span>ได้ {latestResult.earnedCoins} coins</span>
              <small>{new Date(latestResult.completedAt).toLocaleString('th-TH')}</small>
            </div>
          ) : (
            <p className="muted">ยังไม่มีผลล่าสุด</p>
          )}
        </article>
      </div>

      <article className="panel danger-zone">
        <div>
          <h2>รีเซ็ตข้อมูลทดลอง</h2>
          <p>ล้างเหรียญ คะแนน ภารกิจ และรางวัล แต่คงชื่อผู้ใช้กับระดับชั้นไว้</p>
        </div>
        <button className="secondary-button" type="button" onClick={resetProgress}>
          รีเซ็ต progress
        </button>
      </article>
    </section>
  );
};

export default ParentReport;
