import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Typography, Space, Steps, Alert, Checkbox, List, Avatar, Badge, Tooltip, message } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  BulbOutlined, 
  VideoCameraOutlined,
  AudioOutlined,
  WifiOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface PreparationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  tips?: string[];
  estimatedTime: number;
}

interface EnvironmentCheck {
  lighting: boolean;
  background: boolean;
  noise: boolean;
  internet: boolean;
  devices: boolean;
}

interface InterviewPreparationProps {
  onComplete?: () => void;
}

const InterviewPreparation: React.FC<InterviewPreparationProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preparationSteps, setPreparationSteps] = useState<PreparationStep[]>([
    {
      id: 'environment',
      title: 'Подготовка окружения',
      description: 'Создайте идеальные условия для интервью',
      icon: <EnvironmentOutlined />,
      completed: false,
      estimatedTime: 5,
      tips: [
        'Выберите тихое место без отвлекающих звуков',
        'Обеспечьте хорошее освещение лица',
        'Проверьте стабильность интернет-соединения',
        'Подготовьте резервный план на случай технических проблем'
      ]
    },
    {
      id: 'equipment',
      title: 'Проверка оборудования',
      description: 'Убедитесь, что камера и микрофон работают корректно',
      icon: <VideoCameraOutlined />,
      completed: false,
      estimatedTime: 3,
      tips: [
        'Проверьте качество видео и звука',
        'Настройте правильный угол камеры',
        'Убедитесь, что вас хорошо слышно',
        'Проверьте работу гарнитуры или микрофона'
      ]
    },
    {
      id: 'practice',
      title: 'Практические упражнения',
      description: 'Потренируйтесь отвечать на типичные вопросы',
      icon: <BookOutlined />,
      completed: false,
      estimatedTime: 10,
      tips: [
        'Потренируйтесь рассказывать о себе за 2 минуты',
        'Подготовьте примеры ваших достижений',
        'Подумайте о ваших сильных и слабых сторонах',
        'Подготовьте вопросы для интервьюера'
      ]
    },
    {
      id: 'mindset',
      title: 'Психологическая подготовка',
      description: 'Настройтесь на успешное интервью',
      icon: <TrophyOutlined />,
      completed: false,
      estimatedTime: 5,
      tips: [
        'Выспитесь перед интервью',
        'Сделайте дыхательные упражнения',
        'Визуализируйте успешное прохождение',
        'Подготовьте позитивный настрой'
      ]
    }
  ]);

  const [environmentCheck, setEnvironmentCheck] = useState<EnvironmentCheck>({
    lighting: false,
    background: false,
    noise: false,
    internet: false,
    devices: false
  });

  const [practiceQuestions, setPracticeQuestions] = useState([
    {
      id: 1,
      question: 'Расскажите о себе',
      category: 'Общие',
      difficulty: 'easy' as const,
      practiceCount: 0,
      lastPractice: null as Date | null
    },
    {
      id: 2,
      question: 'Почему вы хотите работать в нашей компании?',
      category: 'Мотивация',
      difficulty: 'medium' as const,
      practiceCount: 0,
      lastPractice: null as Date | null
    },
    {
      id: 3,
      question: 'Какие у вас сильные стороны?',
      category: 'Личные качества',
      difficulty: 'easy' as const,
      practiceCount: 0,
      lastPractice: null as Date | null
    },
    {
      id: 4,
      question: 'Расскажите о сложной задаче, которую вы решили',
      category: 'Опыт',
      difficulty: 'hard' as const,
      practiceCount: 0,
      lastPractice: null as Date | null
    }
  ]);

  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    const completed = preparationSteps.filter(step => step.completed).length;
    setCompletedSteps(completed);
    
    const time = preparationSteps.reduce((acc, step) => acc + step.estimatedTime, 0);
    setTotalTime(time);
  }, [preparationSteps]);

  const handleStepComplete = (stepId: string) => {
    setPreparationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
    );
    
    // Автоматически переходим к следующему шагу, если текущий завершен
    const currentStepIndex = preparationSteps.findIndex(step => step.id === stepId);
    if (currentStepIndex === currentStep && currentStep < preparationSteps.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000);
    }
  };

  const handleEnvironmentCheck = (check: keyof EnvironmentCheck) => {
    setEnvironmentCheck(prev => {
      const newState = {
        ...prev,
        [check]: !prev[check]
      };
      
      // Автоматически завершаем шаг, если все проверки пройдены
      const allChecked = Object.values(newState).every(Boolean);
      if (allChecked && currentStep === 0) {
        setTimeout(() => {
          handleStepComplete('environment');
        }, 500);
      }
      
      return newState;
    });
  };

  const handlePracticeQuestion = (questionId: number) => {
    setPracticeQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, practiceCount: q.practiceCount + 1, lastPractice: new Date() }
          : q
      )
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Средне';
      case 'hard': return 'Сложно';
      default: return 'Неизвестно';
    }
  };

  const renderEnvironmentStep = () => (
    <div className="preparation-step-content">
      <Title level={4} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1.5rem' }}>
        Проверьте ваше окружение
      </Title>
      
      <div className="environment-checklist">
        <List
          dataSource={[
            { key: 'lighting', label: 'Хорошее освещение лица', icon: <StarOutlined /> },
            { key: 'background', label: 'Нейтральный фон', icon: <EnvironmentOutlined /> },
            { key: 'noise', label: 'Тихая обстановка', icon: <AudioOutlined /> },
            { key: 'internet', label: 'Стабильный интернет', icon: <WifiOutlined /> },
            { key: 'devices', label: 'Работающие устройства', icon: <VideoCameraOutlined /> }
          ]}
          renderItem={item => (
            <List.Item>
              <Checkbox
                checked={environmentCheck[item.key as keyof EnvironmentCheck]}
                onChange={() => handleEnvironmentCheck(item.key as keyof EnvironmentCheck)}
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                <Space>
                  {item.icon}
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{item.label}</Text>
                </Space>
              </Checkbox>
            </List.Item>
          )}
        />
      </div>

      <Alert
        message="Совет"
        description="Хорошее окружение - это 50% успеха интервью. Потратьте время на подготовку!"
        type="info"
        showIcon
        style={{ marginTop: '1rem' }}
      />
    </div>
  );

  const renderPracticeStep = () => (
    <div className="preparation-step-content">
      <Title level={4} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1.5rem' }}>
        Практические упражнения
      </Title>
      
      <div className="practice-questions">
        {practiceQuestions.map(question => (
          <Card 
            key={question.id} 
            className="practice-question-card"
            style={{ marginBottom: '1rem' }}
          >
            <div className="question-header">
              <div className="question-info">
                <Text strong style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {question.question}
                </Text>
                <div className="question-meta">
                  <Badge 
                    color={getDifficultyColor(question.difficulty)}
                    text={getDifficultyText(question.difficulty)}
                  />
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    {question.category}
                  </Text>
                </div>
              </div>
              <div className="question-stats">
                <Text type="secondary">
                  Практика: {question.practiceCount} раз
                </Text>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handlePracticeQuestion(question.id)}
                  icon={<ThunderboltOutlined />}
                >
                  Практиковать
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStepContent = (step: PreparationStep) => {
    switch (step.id) {
      case 'environment':
        return renderEnvironmentStep();
      case 'practice':
        return renderPracticeStep();
      default:
        return (
          <div className="preparation-step-content">
            <Title level={4} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1.5rem' }}>
              {step.title}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
              {step.description}
            </Paragraph>
            {step.tips && (
              <div className="step-tips">
                <Title level={5} style={{ color: '#a8edea', marginBottom: '1rem' }}>
                  <BulbOutlined style={{ marginRight: '8px' }} />
                  Полезные советы:
                </Title>
                <List
                  dataSource={step.tips}
                  renderItem={tip => (
                    <List.Item>
                      <Text style={{ color: 'rgba(255,255,255,0.8)' }}>• {tip}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        );
    }
  };

  const progress = (completedSteps / preparationSteps.length) * 100;

  return (
    <div className="interview-preparation">
      <Card className="preparation-container">
        <div className="preparation-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <Title level={2} style={{ color: 'rgba(255,255,255,0.95)', margin: 0 }}>
              Подготовка к интервью
            </Title>
            <Button 
              type="default"
              onClick={() => {
                message.success('Подготовка завершена! Вы готовы к интервью.');
                onComplete?.();
              }}
              style={{ 
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              Завершить подготовку
            </Button>
          </div>
          <div className="preparation-progress">
            <Progress 
              percent={progress} 
              strokeColor="#a8edea"
              trailColor="rgba(255,255,255,0.1)"
              format={() => `${completedSteps}/${preparationSteps.length}`}
            />
            <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', display: 'block', marginTop: '0.5rem' }}>
              Общее время подготовки: ~{totalTime} минут
            </Text>
          </div>
        </div>

        <div className="preparation-steps">
          <Steps 
            current={currentStep} 
            onChange={setCurrentStep}
            direction="horizontal"
            className="preparation-steps-component"
          >
            {preparationSteps.map((step, index) => (
              <Step
                key={step.id}
                title={step.title}
                description={`~${step.estimatedTime} мин`}
                icon={step.completed ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : step.icon}
                status={step.completed ? 'finish' : currentStep === index ? 'process' : 'wait'}
              />
            ))}
          </Steps>
        </div>

        <div className="preparation-content">
          {preparationSteps[currentStep] && renderStepContent(preparationSteps[currentStep])}
        </div>

        <div className="preparation-actions">
          {preparationSteps[currentStep] && !preparationSteps[currentStep].completed && currentStep < preparationSteps.length - 1 && (
            <Alert
              message="Совет"
              description="Отметьте текущий шаг как выполненный, чтобы перейти к следующему"
              type="info"
              showIcon
              style={{ marginBottom: '1rem' }}
            />
          )}
          <Space>
            <Button 
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Назад
            </Button>
            <Button 
              type="primary"
              onClick={() => preparationSteps[currentStep] && handleStepComplete(preparationSteps[currentStep].id)}
              icon={preparationSteps[currentStep]?.completed ? <CheckCircleOutlined /> : <CheckCircleOutlined />}
            >
              {preparationSteps[currentStep]?.completed ? 'Отметить как невыполненное' : 'Выполнено'}
            </Button>
            <Button 
              type="primary"
              disabled={currentStep < preparationSteps.length - 1 && !preparationSteps[currentStep]?.completed}
              onClick={() => {
                if (currentStep >= preparationSteps.length - 1) {
                  // Завершаем подготовку
                  message.success('Подготовка завершена! Вы готовы к интервью.');
                  onComplete?.();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
            >
              {currentStep >= preparationSteps.length - 1 ? 'Завершить подготовку' : 'Далее'}
            </Button>
            {currentStep < preparationSteps.length - 1 && (
              <Button 
                type="default"
                onClick={() => {
                  message.success('Подготовка завершена! Вы готовы к интервью.');
                  onComplete?.();
                }}
              >
                Пропустить к завершению
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default InterviewPreparation;
