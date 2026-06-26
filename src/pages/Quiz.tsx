import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestionsForQuest, quests } from '../data';
import { useAppState } from '../store';
import { AppScreen, Mascot, ProgressBar, ScreenHeader } from '../ui';

type AnswerFeedback = 'correct' | 'wrong' | null;

const Quiz: React.FC = () => {
  const { questId = quests[0].id } = useParams();
  const { completeQuest, playSound } = useAppState();
  const quest = quests.find((item) => item.id === questId) || quests[0];
  const quizQuestions = useMemo(() => getQuestionsForQuest(quest.id), [quest.id]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [result, setResult] = useState<{ score: number; earnedCoins: number } | null>(null);

  const currentQuestion = quizQuestions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / quizQuestions.length) * 100);

  const startOver = () => {
    setCurrentIndex(0);
    setSelected('');
    setAnswers({});
    setShowHint(false);
    setFeedback(null);
    setResult(null);
    playSound('tap');
  };

  const handleCheck = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !currentQuestion) {
      return;
    }

    const isCorrect = selected === currentQuestion.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    playSound(isCorrect ? 'success' : 'error');
  };

  const handleNext = () => {
    if (!selected || !currentQuestion) {
      return;
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: selected };
    setAnswers(nextAnswers);
    setFeedback(null);
    setShowHint(false);

    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelected('');
      playSound('tap');
      return;
    }

    const score = quizQuestions.filter((question) => nextAnswers[question.id] === question.answer).length;
    const earnedCoins = completeQuest(quest.id, score, quizQuestions.length);
    setResult({ score, earnedCoins });
  };

  if (result) {
    const perfect = result.score === quizQuestions.length;
    return (
      <AppScreen className="result-screen">
        <div className="celebration">
          <div className="stars">⭐ ⭐ ⭐</div>
          <Mascot mood={perfect ? 'wow' : 'happy'} />
          <h1>{perfect ? 'Great Job!' : 'Quest Complete!'}</h1>
          <p>{perfect ? 'You got it right!' : 'Keep learning and try again for full rewards.'}</p>
        </div>
        <article className="earned-card">
          <h2>You Earned</h2>
          <div className="stat-strip flat">
            <span>🪙 Coins <b>+{result.earnedCoins}</b></span>
            <span>⭐ EXP <b>+{Math.max(10, result.score * 25)}</b></span>
          </div>
        </article>
        <article className="explain-card">
          <h2>Result</h2>
          <p>Score {result.score}/{quizQuestions.length}. Review hints any time to learn from each question.</p>
        </article>
        <div className="result-actions">
          <button className="outline-button" type="button" onClick={startOver}>
            Try Again
          </button>
          <Link className="primary-button" to="/home">
            Continue →
          </Link>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen className="quiz-screen">
      <ScreenHeader
        title={`Question ${currentIndex + 1} of ${quizQuestions.length}`}
        subtitle={quest.topic}
        showBack
        right={<span className="timer">⏱ 00:{25 - currentIndex * 4}</span>}
      />
      <ProgressBar value={progress} />

      <div className="quiz-coach">
        <Mascot compact mood={feedback === 'wrong' ? 'oops' : 'focus'} />
        <p>{feedback === 'wrong' ? "Oops! Let's figure it out together." : "Focus and think! You've got this!"}</p>
      </div>

      <form className={`question-card ${feedback || ''}`} onSubmit={handleCheck}>
        <h1>{currentQuestion.prompt}</h1>
        <div className="answer-list">
          {currentQuestion.options.map((option, index) => (
            <label className={`answer-option ${selected === option ? 'selected' : ''}`} key={option}>
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selected === option}
                disabled={feedback !== null}
                onChange={() => {
                  setSelected(option);
                  playSound('tap');
                }}
              />
              <b>{String.fromCharCode(65 + index)}</b>
              <span>{option}</span>
            </label>
          ))}
        </div>

        {feedback === 'wrong' && (
          <div className="wrong-box">
            <h2>The correct answer is {currentQuestion.answer}.</h2>
            <p>You selected {selected}. {currentQuestion.explanation}</p>
          </div>
        )}

        {feedback === 'correct' && (
          <div className="correct-box">
            <h2>Correct!</h2>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        {showHint && <p className="hint-box">💡 {currentQuestion.hint}</p>}

        <div className="quiz-actions">
          <button className="outline-button" type="button" onClick={() => setShowHint((value) => !value)}>
            Hint
          </button>
          {feedback ? (
            <button className="primary-button" type="button" onClick={handleNext}>
              {currentIndex === quizQuestions.length - 1 ? 'Finish' : 'Continue'}
            </button>
          ) : (
            <button className="primary-button" type="submit" disabled={!selected}>
              Check
            </button>
          )}
        </div>
      </form>
    </AppScreen>
  );
};

export default Quiz;
