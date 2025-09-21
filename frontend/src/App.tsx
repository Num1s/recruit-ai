import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import './App.css';

// Components
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/common/ProtectedRoute.tsx';
import RecruiterRoute from './components/common/RecruiterRoute.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import RegisterPage from './pages/auth/RegisterPage.tsx';
import CandidateDashboard from './pages/candidate/Dashboard.tsx';
import CandidateProfilePage from './pages/candidate/CandidateProfile.tsx';
import CandidateSettings from './pages/candidate/CandidateSettings.tsx';
import MatchingCompanies from './pages/candidate/MatchingCompanies.tsx';
import JobListings from './pages/candidate/JobListings.tsx';
import JobDetails from './pages/candidate/JobDetails.tsx';
import CompanyDashboard from './pages/company/Dashboard.tsx';
import InterviewProcess from './pages/candidate/InterviewProcess.tsx';
import CandidateReport from './pages/company/CandidateReport.tsx';
import CompanyProfile from './pages/company/CompanyProfile.tsx';
import CompanySettings from './pages/company/CompanySettings.tsx';
import MatchingCandidates from './pages/company/MatchingCandidates.tsx';
import JobManagement from './pages/company/JobManagement.tsx';
import JobCandidates from './pages/company/JobCandidates.tsx';
import InterviewReports from './pages/company/InterviewReports.tsx';
import InterviewInvitations from './pages/candidate/InterviewInvitations.tsx';
import InterviewCalendarPage from './pages/candidate/InterviewCalendarPage.tsx';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboardSimple.tsx';

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
                      <Route path="profile" element={<CandidateProfilePage />} />
                      <Route path="settings" element={<CandidateSettings />} />
                      <Route path="companies" element={<MatchingCompanies />} />
                      <Route path="jobs" element={<JobListings />} />
                      <Route path="jobs/:jobId" element={<JobDetails />} />
                      <Route path="invitations" element={<InterviewInvitations />} />
                      <Route path="calendar" element={<InterviewCalendarPage />} />
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
                      <Route path="jobs" element={<JobManagement />} />
                      <Route path="jobs/:jobId/candidates" element={<JobCandidates />} />
                      <Route path="reports" element={<InterviewReports />} />
                      <Route path="profile" element={<CompanyProfile />} />
                      <Route path="settings" element={<CompanySettings />} />
                      <Route path="*" element={<Navigate to="/company/dashboard" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Защищенные роуты для рекрутеров */}
              <Route
                path="/recruiter/*"
                element={
                  <RecruiterRoute>
                    <Routes>
                      <Route path="dashboard" element={<RecruiterDashboard />} />
                      <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
                    </Routes>
                  </RecruiterRoute>
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
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#667eea',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#667eea',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif',
          fontSize: 14,
          lineHeight: 1.5,
          colorBgBase: '#0f0f23',
          colorBgContainer: 'rgba(255, 255, 255, 0.08)',
          colorBgElevated: 'rgba(255, 255, 255, 0.1)',
          colorText: '#ffffff',
          colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
          colorTextTertiary: 'rgba(255, 255, 255, 0.5)',
          colorBorder: 'rgba(255, 255, 255, 0.15)',
          colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
        },
        components: {
          Button: {
            borderRadius: 8,
            fontWeight: 500,
            primaryShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
            defaultActiveBg: 'rgba(255, 255, 255, 0.1)',
            defaultHoverBg: 'rgba(255, 255, 255, 0.15)',
          },
          Card: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            headerBg: 'rgba(255, 255, 255, 0.05)',
            colorBgContainer: 'rgba(255, 255, 255, 0.08)',
          },
          Input: {
            borderRadius: 8,
            colorBgContainer: 'rgba(255, 255, 255, 0.1)',
            activeBorderColor: '#667eea',
            hoverBorderColor: '#8b9cf7',
          },
          Table: {
            headerBg: 'rgba(255, 255, 255, 0.05)',
            rowHoverBg: 'rgba(255, 255, 255, 0.05)',
            colorBgContainer: 'rgba(255, 255, 255, 0.08)',
          },
          Tabs: {
            inkBarColor: '#667eea',
            itemActiveColor: '#667eea',
            itemHoverColor: '#8b9cf7',
          },
          Tag: {
            colorBgContainer: 'rgba(255, 255, 255, 0.1)',
            colorBorder: 'rgba(255, 255, 255, 0.2)',
          },
          Dropdown: {
            colorBgElevated: 'rgba(26, 26, 46, 0.95)',
            colorBorder: 'rgba(255, 255, 255, 0.2)',
          },
          Modal: {
            contentBg: 'rgba(26, 26, 46, 0.95)',
            headerBg: 'rgba(255, 255, 255, 0.05)',
          },
          Progress: {
            colorSuccess: '#52c41a',
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
