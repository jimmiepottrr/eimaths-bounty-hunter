import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen, Logo, Mascot } from '../ui';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, playSound } = useAppState();
  const [parentName, setParentName] = useState('Parent');
  const [childName, setChildName] = useState('Hunter');
  const [email, setEmail] = useState('parent@example.com');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    login({ parentName, childName, email });
    navigate('/grade');
  };

  return (
    <AppScreen className="login-art">
      <div className="splash-panel">
        <Logo />
        <div className="island-scene">
          <div className="sun" />
          <div className="cloud c1" />
          <div className="cloud c2" />
          <Mascot />
          <div className="treasure">🪙</div>
        </div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="speech-bubble">Let's learn math and earn awesome rewards!</div>
        <h1>Welcome, Young Bounty Hunter!</h1>
        <label>
          Student Code
          <input value={childName} onChange={(event) => setChildName(event.target.value)} required />
        </label>
        <label>
          Parent Name
          <input value={parentName} onChange={(event) => setParentName(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button className="primary-button wide" type="submit" onClick={() => playSound('tap')}>
          Login →
        </button>
        <button className="outline-button wide" type="button" onClick={() => playSound('tap')}>
          Scan QR Code
        </button>
      </form>
    </AppScreen>
  );
};

export default Login;
