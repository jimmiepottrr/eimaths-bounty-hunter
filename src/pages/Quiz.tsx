import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestionsForQuest, quests } from '../data';
import { useAppState } from '../store';

const Quiz: React.FC = () => {
  const { questId = quests[0].id } = useParams();
  const { completeQuest } = useAppState();
  const quest = quests.find((item) => item.id === questId) || quests[0];
  const quizQuestions = useMemo(() => getQuestionsForQuest(quest.id), [quest.id]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{ score: number; earnedCoins: number } | null>(null);

  const currentQuestion = quizQuestions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / quizQuestions.length) * 100);

  const startOver = () => {
    setCurrentIndex(0);
    setSelected('');
    setAnswers({});
    setShowHint(false);
    setResult(null);
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !currentQuestion) {
      return;
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    setAnswers(nextAnswers);
    setShowHint(false);

    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelected('');
      return;
    }

    const score = quizQuestions.filter((question) => nextAnswers[question.id] === question.answer).length;
    const earnedCoins = completeQuest(quest.id, score, quizQuestions.length);
    setResult({ score, earnedCoins });
  };

  if (result) {
    const perfect = result.score === quizQuestions.length;
    return (
      <section className="page-stack">
        <article className="result-panel">
          <p className="eyebrow">{perfect ? 'Perfect clear' : 'Quest complete'}</p>
          <h1>{perfect ? 'สุดยอด นักล่าทำได้ครบ!' : 'จบภารกิจแล้ว'}</h1>
          <p>
            คะแนน {result.score}/{quizQuestions.length} · ได้รับ {result.earnedCoins} coins
          </p>
          <div className="result-actions">
            <button className="secondary-button" type="button" onClick={startOver}>
              เล่นซ้ำ
            </button>
            <Link className="primary-button" to="/wallet">
              ดูกระเป๋าเหรียญ
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">{quest.topic}</p>
        <h1>{quest.title}</h1>
        <p>{quest.description}</p>
      </div>

      <article className="quiz-panel">
        <div className="quiz-progress">
          <span>ข้อ {currentIndex + 1}/{quizQuestions.length}</span>
          <div className="progress-track" aria-label={`Progress ${progress}%`}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form onSubmit={handleNext}>
          <h2>{currentQuestion.prompt}</h2>
          <div className="answer-grid">
            {currentQuestion.options.map((option) => (
              <label className={`answer-option ${selected === option ? 'selected' : ''}`} key={option}>
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selected === option}
                  onChange={() => setSelected(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          {showHint && <p className="hint-box">{currentQuestion.hint}</p>}

          <div className="quiz-actions">
            <button className="ghost-button" type="button" onClick={() => setShowHint((value) => !value)}>
              {showHint ? 'ซ่อนคำใบ้' : 'ขอคำใบ้'}
            </button>
            <button className="primary-button" type="submit" disabled={!selected}>
              {currentIndex === quizQuestions.length - 1 ? 'ส่งคำตอบ' : 'ข้อต่อไป'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
};

export default Quiz;
