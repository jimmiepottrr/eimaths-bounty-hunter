import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Wallet from './pages/Wallet';
import Rewards from './pages/Rewards';
import ParentReport from './pages/ParentReport';
import Intro from './pages/Intro';
import AdventureMap from './pages/AdventureMap';
import Cutscene from './pages/Cutscene';
import Header from './components/Header';
import { useAppState } from './store';

const RequireSession: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoggedIn } = useAppState();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { playSound } = useAppState();

  const handleGlobalPress = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, [role="button"]')) {
      playSound('tap');
    }
  };

  return (
    <div className="app" onPointerDownCapture={handleGlobalPress}>
      <Header />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/intro" element={<RequireSession><Intro /></RequireSession>} />
          <Route path="/map" element={<RequireSession><AdventureMap /></RequireSession>} />
          <Route path="/home" element={<RequireSession><Home /></RequireSession>} />
          <Route path="/quiz/:scene" element={<RequireSession><Quiz /></RequireSession>} />
          <Route path="/cutscene/:id" element={<RequireSession><Cutscene /></RequireSession>} />
          <Route path="/wallet" element={<RequireSession><Wallet /></RequireSession>} />
          <Route path="/rewards" element={<RequireSession><Rewards /></RequireSession>} />
          <Route path="/parent-report" element={<RequireSession><ParentReport /></RequireSession>} />
          {/* เส้นทางเก่าจาก demo เฟส 1 */}
          <Route path="/grade" element={<Navigate to="/map" replace />} />
          <Route path="/quest" element={<Navigate to="/map" replace />} />
          <Route path="/quiz" element={<Navigate to="/map" replace />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
