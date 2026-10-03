import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { checkHealth } from './services/api';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import ResumeUpload from './pages/ResumeUpload';
import Screening from './pages/Screening';
import Candidates from './pages/Candidates';
import Settings from './pages/Settings';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('recruiter_user');
      return saved ? JSON.parse(saved) : { name: 'Recruiter Admin', email: 'admin@company.com' };
    } catch {
      return { name: 'Recruiter Admin', email: 'admin@company.com' };
    }
  });

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await checkHealth();
      setHealthData(data);
    } catch (err) {
      console.warn('Backend currently unreachable:', err.message);
      setHealthData({
        server: 'offline',
        database: 'disconnected',
        database_type: 'Unknown',
        message: err.message,
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('recruiter_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={(u) => setUser(u)} />
            )
          }
        />

        {/* Authenticated Dashboard Shell */}
        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="app-container">
                {/* Navigation Sidebar */}
                <Sidebar />

                {/* Main Application Area */}
                <div className="main-content">
                  <Navbar
                    healthData={healthData}
                    loadingHealth={loadingHealth}
                    onRefreshHealth={fetchHealth}
                    user={user}
                    onLogout={handleLogout}
                  />

                  <main className="page-wrapper">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/upload" element={<ResumeUpload />} />
                      <Route path="/screening" element={<Screening />} />
                      <Route path="/candidates" element={<Candidates />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>

                  <footer
                    style={{
                      padding: '1.25rem 2rem',
                      textAlign: 'center',
                      color: 'var(--text-light)',
                      fontSize: '0.82rem',
                      borderTop: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    Resume Screening System • 100% Rule-Based & Deterministic (No AI/ML) &copy; 2026
                  </footer>
                </div>
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
