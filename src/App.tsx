import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Grade from './pages/Grade';
import Home from './pages/Home';
import Quest from './pages/Quest';
import Quiz from './pages/Quiz';
import Wallet from './pages/Wallet';
import Rewards from './pages/Rewards';
import ParentReport from './pages/ParentReport';
import Header from './components/Header';
import { useAppState } from './store';

const RequireSession: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoggedIn } = useAppState();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/grade" element={<RequireSession><Grade /></RequireSession>} />
          <Route path="/home" element={<RequireSession><Home /></RequireSession>} />
          <Route path="/quest" element={<RequireSession><Quest /></RequireSession>} />
          <Route path="/quiz" element={<RequireSession><Quiz /></RequireSession>} />
          <Route path="/quiz/:questId" element={<RequireSession><Quiz /></RequireSession>} />
          <Route path="/wallet" element={<RequireSession><Wallet /></RequireSession>} />
          <Route path="/rewards" element={<RequireSession><Rewards /></RequireSession>} />
          <Route path="/parent-report" element={<RequireSession><ParentReport /></RequireSession>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
