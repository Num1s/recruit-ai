import React from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CandidateSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/candidate/dashboard')}
          className="report-back-button"
        >
          Назад к дашборду
        </Button>
        
        <div className="profile-hero">
          <Title level={2} className="profile-page-title">
            Настройки
          </Title>
        </div>
      </div>

      <div className="profile-content">
        <Card className="profile-tabs-card">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Title level={3}>Настройки кандидата</Title>
            <Text type="secondary">
              Эта страница находится в разработке. Здесь будут настройки профиля кандидата.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateSettings;


