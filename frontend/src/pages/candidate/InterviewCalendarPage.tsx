import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import InterviewCalendar from '../../components/candidate/InterviewCalendar.tsx';

const InterviewCalendarPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/candidate/dashboard')}
          className="ant-btn"
        >
          Назад к дашборду
        </Button>
      </div>
      
      <InterviewCalendar />
    </div>
  );
};

export default InterviewCalendarPage;
