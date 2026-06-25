import React, { useState } from 'react';

// A simple quiz page component. It presents a single question
// with four options. The user receives immediate feedback on
// whether the selected answer is correct. In a real application
// questions would be fetched from a backend and progress would
// be tracked across multiple questions.
const Quiz: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const question = {
    text: '2 + 3 เท่ากับเท่าไหร่?',
    options: [
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' },
      { value: '7', label: '7' },
    ],
    correct: '5',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === null) {
      setFeedback('กรุณาเลือกคำตอบ');
    } else if (selected === question.correct) {
      setFeedback('ถูกต้อง! คุณได้รับ 10 เหรียญ');
    } else {
      setFeedback('ยังไม่ถูกต้อง ลองใหม่อีกครั้ง');
    }
  };

  return (
    <div>
      <h1>แบบทดสอบ</h1>
      <p>{question.text}</p>
      <form onSubmit={handleSubmit}>
        {question.options.map((opt) => (
          <div key={opt.value} style={{ marginBottom: '0.5rem' }}>
            <label>
              <input
                type="radio"
                name="answer"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
              />{' '}
              {opt.label}
            </label>
          </div>
        ))}
        <button type="submit">ส่งคำตอบ</button>
      </form>
      {feedback && <p style={{ marginTop: '1rem' }}>{feedback}</p>}
    </div>
  );
};

export default Quiz;