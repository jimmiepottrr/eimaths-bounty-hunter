import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppState();
  const [parentName, setParentName] = useState('ผู้ปกครอง');
  const [childName, setChildName] = useState('น้องอีมาย');
  const [email, setEmail] = useState('parent@example.com');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login({ parentName, childName, email });
    navigate('/grade');
  };

  return (
    <section className="login-page">
      <div className="login-hero">
        <p className="eyebrow">Math quest dashboard</p>
        <h1>Eimaths Bounty Hunter</h1>
        <p>
          เกมฝึกคณิตสำหรับเด็ก พร้อมเหรียญ ภารกิจ ของรางวัล และรายงานสำหรับผู้ปกครองในเครื่องเดียว
        </p>
        <div className="hero-stats" aria-label="Product highlights">
          <span>3 ภารกิจ</span>
          <span>9 คำถาม</span>
          <span>4 รางวัล</span>
        </div>
      </div>

      <form className="login-panel" onSubmit={handleSubmit}>
        <h2>เริ่มใช้งาน</h2>
        <label>
          ชื่อผู้ปกครอง
          <input value={parentName} onChange={(event) => setParentName(event.target.value)} required />
        </label>
        <label>
          ชื่อนักเรียน
          <input value={childName} onChange={(event) => setChildName(event.target.value)} required />
        </label>
        <label>
          อีเมล
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button className="primary-button" type="submit">
          เข้าสู่เกม
        </button>
      </form>
    </section>
  );
};

export default Login;
