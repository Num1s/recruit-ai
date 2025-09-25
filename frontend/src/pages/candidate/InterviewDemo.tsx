import React, { useState } from 'react';
import { Card, Tabs, Space, Typography, Button, message } from 'antd';
import { 
  VideoCameraOutlined, 
  BarChartOutlined, 
  BookOutlined, 
  RobotOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import InterviewPreparation from '../../components/interview/InterviewPreparation.tsx';
import AdvancedMetrics from '../../components/interview/AdvancedMetrics.tsx';
import SmartAIAssistant from '../../components/interview/SmartAIAssistant.tsx';
import InterviewPractice from '../../components/interview/InterviewPractice.tsx';

const { Title, Text } = Typography;

const InterviewDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('preparation');

  const mockMetrics = {
    speech: {
      volume: 75,
      clarity: 85,
      pace: 60,
      confidence: 80,
      emotion: 'positive' as const,
      energy: 75
    },
    performance: {
      responseTime: 3.5,
      completeness: 85,
      relevance: 90,
      structure: 80,
      engagement: 75
    },
    overall: 82,
    trends: {
      improvement: 15,
      consistency: 85,
      adaptability: 78
    }
  };

  const mockSpeechMetrics = {
    volume: 75,
    clarity: 85,
    pace: 60,
    confidence: 80
  };

  const mockPerformanceMetrics = {
    responseTime: 3.5,
    completeness: 85,
    relevance: 90
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title level={1} style={{ 
            color: 'rgba(255,255,255,0.95)', 
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Демонстрация улучшенной системы интервью
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px' }}>
            Новые возможности для проведения качественных интервью с AI-помощником
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'preparation',
              label: (
                <Space>
                  <PlayCircleOutlined />
                  Подготовка к интервью
                </Space>
              ),
              children: <InterviewPreparation onComplete={() => message.success('Подготовка завершена!')} />
            },
            {
              key: 'practice',
              label: (
                <Space>
                  <BookOutlined />
                  Практика
                </Space>
              ),
              children: <InterviewPractice />
            },
            {
              key: 'metrics',
              label: (
                <Space>
                  <BarChartOutlined />
                  Аналитика
                </Space>
              ),
              children: (
                <AdvancedMetrics 
                  metrics={mockMetrics}
                  isRealTime={true}
                />
              )
            },
            {
              key: 'assistant',
              label: (
                <Space>
                  <RobotOutlined />
                  AI Помощник
                </Space>
              ),
              children: (
                <div style={{ padding: '2rem' }}>
                  <Card style={{ 
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px'
                  }}>
                    <Title level={3} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '2rem' }}>
                      Демонстрация AI Помощника
                    </Title>
                    <SmartAIAssistant 
                      currentQuestion="Расскажите о вашем опыте работы с React"
                      speechMetrics={mockSpeechMetrics}
                      performanceMetrics={mockPerformanceMetrics}
                      interviewPhase="speaking"
                    />
                  </Card>
                </div>
              )
            }
          ]}
          className="demo-tabs"
        />
      </div>
    </div>
  );
};

export default InterviewDemo;
