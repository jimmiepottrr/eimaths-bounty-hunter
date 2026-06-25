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

// The App component defines the top-level layout and application routes.
// We use React Router's `Routes` and `Route` components to map paths
// to their corresponding page components. A simple header is shown on
// most pages to demonstrate navigation.
const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/grade" element={<Grade />} />
          <Route path="/home" element={<Home />} />
          <Route path="/quest" element={<Quest />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/parent-report" element={<ParentReport />} />
          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;