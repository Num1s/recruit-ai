import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import 'antd/dist/reset.css';
import './App.css';

// Components
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/common/ProtectedRoute.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import CandidateDashboard from './pages/candidate/Dashboard.tsx';
import CompanyDashboard from './pages/company/Dashboard.tsx';
import InterviewProcess from './pages/candidate/InterviewProcess.tsx';
import CandidateReport from './pages/company/CandidateReport.tsx';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные роуты */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Защищенные роуты для кандидатов */}
      <Route
        path="/candidate/*"
        element={
          <ProtectedRoute requiredRole="candidate">
            <Routes>
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="interview/:invitationId" element={<InterviewProcess />} />
              <Route path="*" element={<Navigate to="/candidate/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Защищенные роуты для компаний */}
      <Route
        path="/company/*"
        element={
          <ProtectedRoute requiredRole="company">
            <Routes>
              <Route path="dashboard" element={<CompanyDashboard />} />
              <Route path="candidate/:candidateId/report" element={<CandidateReport />} />
              <Route path="*" element={<Navigate to="/company/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Редирект на главную для неизвестных роутов */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider 
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
