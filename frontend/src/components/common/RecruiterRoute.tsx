import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface RecruiterRouteProps {
  children: ReactNode;
}

const RecruiterRoute: React.FC<RecruiterRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Проверяем, что пользователь имеет права рекрутера
  const recruiterRoles = ['recruiter', 'senior_recruiter', 'recruit_lead', 'admin'];
  const hasRecruiterAccess = recruiterRoles.includes(user.role);

  if (!hasRecruiterAccess) {
    // Редирект на соответствующий dashboard в зависимости от роли
    let redirectPath = '/';
    
    switch (user.role) {
      case 'candidate':
        redirectPath = '/candidate/dashboard';
        break;
      case 'company':
        redirectPath = '/company/dashboard';
        break;
      default:
        redirectPath = '/';
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RecruiterRoute;


