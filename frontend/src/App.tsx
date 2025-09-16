import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import 'antd/dist/reset.css';
import './App.css';

// Components
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/common/ProtectedRoute.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import CandidateDashboard from './pages/candidate/Dashboard.tsx';
import CandidateProfile from './pages/candidate/CandidateProfile.tsx';
import CandidateSettings from './pages/candidate/CandidateSettings.tsx';
import MatchingCompanies from './pages/candidate/MatchingCompanies.tsx';
import CompanyDashboard from './pages/company/Dashboard.tsx';
import InterviewProcess from './pages/candidate/InterviewProcess.tsx';
import CandidateReport from './pages/company/CandidateReport.tsx';
import CompanyProfile from './pages/company/CompanyProfile.tsx';
import CompanySettings from './pages/company/CompanySettings.tsx';
import MatchingCandidates from './pages/company/MatchingCandidates.tsx';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="loading-text">Загрузка...</div>
        </div>
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
                      <Route path="profile" element={<CandidateProfile />} />
                      <Route path="settings" element={<CandidateSettings />} />
                      <Route path="companies" element={<MatchingCompanies />} />
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
                      <Route path="candidates" element={<MatchingCandidates />} />
                      <Route path="candidate/:candidateId/report" element={<CandidateReport />} />
                      <Route path="profile" element={<CompanyProfile />} />
                      <Route path="settings" element={<CompanySettings />} />
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
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#a8edea',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#1890ff',
          borderRadius: 12,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
          fontSize: 14,
          lineHeight: 1.5,
          colorBgBase: 'rgba(255, 255, 255, 0.08)',
          colorBgContainer: 'rgba(255, 255, 255, 0.08)',
          colorBgElevated: 'rgba(255, 255, 255, 0.12)',
          colorText: 'rgba(255, 255, 255, 0.85)',
          colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
          colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
          colorBorder: 'rgba(255, 255, 255, 0.15)',
          colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
        },
        components: {
          Button: {
            borderRadius: 12,
            fontWeight: 600,
            primaryShadow: '0 4px 16px rgba(168, 237, 234, 0.3)',
            defaultActiveBg: 'rgba(255, 255, 255, 0.15)',
            defaultHoverBg: 'rgba(255, 255, 255, 0.1)',
          },
          Card: {
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            headerBg: 'rgba(255, 255, 255, 0.05)',
            colorBgContainer: 'rgba(255, 255, 255, 0.08)',
          },
          Input: {
            borderRadius: 10,
            colorBgContainer: 'rgba(255, 255, 255, 0.08)',
            activeBorderColor: '#a8edea',
            hoverBorderColor: 'rgba(168, 237, 234, 0.5)',
          },
          Table: {
            headerBg: 'rgba(255, 255, 255, 0.1)',
            rowHoverBg: 'rgba(255, 255, 255, 0.1)',
            colorBgContainer: 'transparent',
          },
          Tabs: {
            inkBarColor: '#a8edea',
            itemActiveColor: '#a8edea',
            itemHoverColor: 'rgba(168, 237, 234, 0.7)',
          },
          Tag: {
            colorBgContainer: 'rgba(255, 255, 255, 0.1)',
            colorBorder: 'rgba(255, 255, 255, 0.2)',
          },
          Dropdown: {
            colorBgElevated: 'rgba(26, 26, 46, 0.95)',
            colorBorder: 'rgba(255, 255, 255, 0.15)',
          },
          Modal: {
            contentBg: 'rgba(26, 26, 46, 0.95)',
            headerBg: 'rgba(255, 255, 255, 0.05)',
          },
          Progress: {
            colorSuccess: '#a8edea',
            remainingColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;
