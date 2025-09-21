import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { UserOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.tsx';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // Если пользователь уже авторизован, редиректим на соответствующий dashboard
    if (user) {
      let redirectPath = '/';
      
      switch (user.role) {
        case 'candidate':
          redirectPath = '/candidate/dashboard';
          break;
        case 'company':
          redirectPath = '/company/dashboard';
          break;
        case 'recruiter':
        case 'senior_recruiter':
        case 'recruit_lead':
        case 'admin':
          redirectPath = '/recruiter/dashboard';
          break;
        default:
          redirectPath = '/';
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleRoleSelection = (role: 'candidate' | 'company') => {
    navigate(`/register?role=${role}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1 className="home-title">Recruit.ai</h1>
          <p className="home-subtitle">
            Всесторонняя HR-платформа для IT и финтеха Кыргызстана
          </p>
        </div>

        <div className="role-selection">
          <div className="role-card" onClick={() => handleRoleSelection('candidate')}>
            <div className="role-icon">
              <UserOutlined />
            </div>
            <h3 className="role-title">Я кандидат</h3>
            <p className="role-description">
              Ищу работу в IT или финтехе. Хочу пройти AI-интервью и получить обратную связь.
            </p>
            <Button type="primary" size="large" block>
              Начать как кандидат
            </Button>
          </div>

          <div className="role-card" onClick={() => handleRoleSelection('company')}>
            <div className="role-icon">
              <BankOutlined />
            </div>
            <h3 className="role-title">Я компания</h3>
            <p className="role-description">
              Ищу талантливых сотрудников. Хочу использовать AI для оценки кандидатов.
            </p>
            <Button type="primary" size="large" block>
              Начать как компания
            </Button>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Button type="link" onClick={handleLogin} style={{ color: 'white', fontSize: '16px' }}>
            Уже есть аккаунт? Войти
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
