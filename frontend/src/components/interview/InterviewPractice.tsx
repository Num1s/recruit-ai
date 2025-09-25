import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Space, Progress, Badge, List, Avatar, Tooltip, Modal, Rate, Alert, Row, Col, Statistic } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined, 
  ReloadOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  BookOutlined,
  TagOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface PracticeQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  tips: string[];
  practiceCount: number;
  bestScore: number;
  lastPractice?: Date;
  averageTime: number;
}

interface PracticeSession {
  id: string;
  questions: PracticeQuestion[];
  startTime: Date;
  endTime?: Date;
  totalScore: number;
  completed: boolean;
}

interface PracticeMetrics {
  totalQuestions: number;
  completedQuestions: number;
  averageScore: number;
  totalTime: number;
  improvement: number;
  streak: number;
}

const InterviewPractice: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [practiceMetrics, setPracticeMetrics] = useState<PracticeMetrics>({
    totalQuestions: 0,
    completedQuestions: 0,
    averageScore: 0,
    totalTime: 0,
    improvement: 0,
    streak: 0
  });

  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([
    {
      id: '1',
      question: 'Расскажите о себе и вашем профессиональном опыте',
      category: 'Общие',
      difficulty: 'easy',
      estimatedTime: 120,
      tips: [
        'Начните с краткого представления',
        'Расскажите о своем образовании',
        'Опишите ключевые проекты и достижения',
        'Закончите тем, что вас мотивирует'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    },
    {
      id: '2',
      question: 'Почему вы хотите работать именно в нашей компании?',
      category: 'Мотивация',
      difficulty: 'medium',
      estimatedTime: 90,
      tips: [
        'Исследуйте компанию заранее',
        'Свяжите свои цели с миссией компании',
        'Покажите, что вы понимаете культуру',
        'Расскажите о ваших ожиданиях'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    },
    {
      id: '3',
      question: 'Какие у вас сильные и слабые стороны?',
      category: 'Личные качества',
      difficulty: 'medium',
      estimatedTime: 120,
      tips: [
        'Будьте честными, но позитивными',
        'Приведите конкретные примеры',
        'Покажите, как вы работаете над слабостями',
        'Свяжите сильные стороны с работой'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    },
    {
      id: '4',
      question: 'Расскажите о самом сложном проекте, над которым вы работали',
      category: 'Опыт',
      difficulty: 'hard',
      estimatedTime: 180,
      tips: [
        'Используйте метод STAR',
        'Опишите технические вызовы',
        'Расскажите о решениях и подходах',
        'Объясните, что вы извлекли из опыта'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    },
    {
      id: '5',
      question: 'Как вы решаете конфликты в команде?',
      category: 'Поведенческие',
      difficulty: 'medium',
      estimatedTime: 120,
      tips: [
        'Приведите конкретный пример',
        'Опишите свой подход к решению',
        'Покажите навыки коммуникации',
        'Объясните результат и уроки'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    },
    {
      id: '6',
      question: 'Где вы видите себя через 5 лет?',
      category: 'Карьера',
      difficulty: 'easy',
      estimatedTime: 90,
      tips: [
        'Будьте реалистичны в планах',
        'Свяжите цели с позицией',
        'Покажите готовность к развитию',
        'Продемонстрируйте амбиции'
      ],
      practiceCount: 0,
      bestScore: 0,
      averageTime: 0
    }
  ]);

  const [selectedQuestions, setSelectedQuestions] = useState<PracticeQuestion[]>([]);
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);

  // Таймер записи
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startPracticeSession = () => {
    const questions = selectedQuestions.length > 0 ? selectedQuestions : practiceQuestions.slice(0, 3);
    const session: PracticeSession = {
      id: `session-${Date.now()}`,
      questions,
      startTime: new Date(),
      totalScore: 0,
      completed: false
    };
    setCurrentSession(session);
    setCurrentQuestionIndex(0);
    setShowQuestionSelection(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setShowResults(true);
  };

  const evaluateAnswer = (timeSpent: number, question: PracticeQuestion) => {
    // Простая система оценки на основе времени и сложности
    const timeScore = Math.max(0, 100 - Math.abs(timeSpent - question.estimatedTime) * 2);
    const difficultyMultiplier = question.difficulty === 'easy' ? 1 : 
                                 question.difficulty === 'medium' ? 1.2 : 1.5;
    
    const score = Math.min(100, timeScore * difficultyMultiplier);
    
    // Обновляем статистику вопроса
    setPracticeQuestions(prev => 
      prev.map(q => 
        q.id === question.id 
          ? { 
              ...q, 
              practiceCount: q.practiceCount + 1,
              bestScore: Math.max(q.bestScore, score),
              averageTime: (q.averageTime * q.practiceCount + timeSpent) / (q.practiceCount + 1),
              lastPractice: new Date()
            }
          : q
      )
    );

    return score;
  };

  const nextQuestion = () => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
      const score = evaluateAnswer(recordingTime, currentSession.questions[currentQuestionIndex]);
      setCurrentSession(prev => prev ? {
        ...prev,
        totalScore: prev.totalScore + score
      } : null);
      
      setCurrentQuestionIndex(prev => prev + 1);
      setRecordingTime(0);
      setShowResults(false);
    } else {
      // Завершение сессии
      if (currentSession) {
        const finalScore = evaluateAnswer(recordingTime, currentSession.questions[currentQuestionIndex]);
        setCurrentSession(prev => prev ? {
          ...prev,
          totalScore: prev.totalScore + finalScore,
          endTime: new Date(),
          completed: true
        } : null);
      }
    }
  };

  const resetSession = () => {
    setCurrentSession(null);
    setCurrentQuestionIndex(0);
    setRecordingTime(0);
    setIsRecording(false);
    setShowResults(false);
  };

  const selectQuestions = (questions: PracticeQuestion[]) => {
    setSelectedQuestions(questions);
    setShowQuestionSelection(false);
  };

  const renderQuestionSelection = () => (
    <Modal
      title="Выберите вопросы для практики"
      open={showQuestionSelection}
      onCancel={() => setShowQuestionSelection(false)}
      footer={[
        <Button key="cancel" onClick={() => setShowQuestionSelection(false)}>
          Отмена
        </Button>,
        <Button 
          key="start" 
          type="primary" 
          onClick={() => selectQuestions(selectedQuestions)}
          disabled={selectedQuestions.length === 0}
        >
          Начать практику ({selectedQuestions.length} вопросов)
        </Button>
      ]}
      width={800}
    >
      <List
        dataSource={practiceQuestions}
        renderItem={question => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {question.question}
                  </Text>
                  <div style={{ marginTop: '8px' }}>
                    <Space>
                      <Badge 
                        color={getDifficultyColor(question.difficulty)}
                        text={getDifficultyText(question.difficulty)}
                      />
                      <Text type="secondary">{question.category}</Text>
                      <Text type="secondary">
                        <ClockCircleOutlined /> ~{question.estimatedTime}с
                      </Text>
                      {question.practiceCount > 0 && (
                        <Text type="secondary">
                          Практика: {question.practiceCount} раз
                        </Text>
                      )}
                    </Space>
                  </div>
                </div>
                <Button
                  type={selectedQuestions.includes(question) ? "primary" : "default"}
                  onClick={() => {
                    if (selectedQuestions.includes(question)) {
                      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
                    } else {
                      setSelectedQuestions(prev => [...prev, question]);
                    }
                  }}
                >
                  {selectedQuestions.includes(question) ? 'Выбрано' : 'Выбрать'}
                </Button>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );

  const renderCurrentQuestion = () => {
    if (!currentSession) return null;
    
    const currentQuestion = currentSession.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentSession.questions.length) * 100;

    return (
      <Card className="practice-question-card">
        <div className="question-header">
          <div className="question-progress">
            <Progress 
              percent={progress} 
              strokeColor="#a8edea"
              format={() => `${currentQuestionIndex + 1}/${currentSession.questions.length}`}
            />
          </div>
          <div className="question-meta">
            <Space>
              <Badge 
                color={getDifficultyColor(currentQuestion.difficulty)}
                text={getDifficultyText(currentQuestion.difficulty)}
              />
              <Text type="secondary">{currentQuestion.category}</Text>
              <Text type="secondary">
                <ClockCircleOutlined /> ~{currentQuestion.estimatedTime}с
              </Text>
            </Space>
          </div>
        </div>

        <div className="question-content">
          <Title level={3} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1.5rem' }}>
            {currentQuestion.question}
          </Title>

          <div className="question-tips">
            <Title level={5} style={{ color: '#a8edea', marginBottom: '1rem' }}>
              <BulbOutlined style={{ marginRight: '8px' }} />
              Советы для ответа:
            </Title>
            <List
              dataSource={currentQuestion.tips}
              renderItem={tip => (
                <List.Item>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>• {tip}</Text>
                </List.Item>
              )}
            />
          </div>
        </div>

        <div className="recording-section">
          <div className="recording-timer">
            <Text style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: isRecording ? '#ff4d4f' : '#a8edea' 
            }}>
              {formatTime(recordingTime)}
            </Text>
          </div>

          <div className="recording-controls">
            {!isRecording ? (
              <Button 
                type="primary" 
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={startRecording}
                className="start-recording-button"
              >
                Начать запись ответа
              </Button>
            ) : (
              <Space>
                <Button 
                  danger
                  size="large"
                  icon={<StopOutlined />}
                  onClick={stopRecording}
                >
                  Завершить запись
                </Button>
                <Button 
                  icon={<PauseCircleOutlined />}
                  size="large"
                >
                  Пауза
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderResults = () => {
    if (!currentSession || !showResults) return null;
    
    const currentQuestion = currentSession.questions[currentQuestionIndex];
    const score = evaluateAnswer(recordingTime, currentQuestion);
    const timeScore = Math.max(0, 100 - Math.abs(recordingTime - currentQuestion.estimatedTime) * 2);

    return (
      <Modal
        title="Результаты ответа"
        open={showResults}
        onCancel={() => setShowResults(false)}
        footer={[
          <Button key="retry" icon={<ReloadOutlined />} onClick={() => {
            setShowResults(false);
            setRecordingTime(0);
          }}>
            Попробовать снова
          </Button>,
          <Button 
            key="next" 
            type="primary" 
            onClick={() => {
              setShowResults(false);
              nextQuestion();
            }}
          >
            {currentQuestionIndex >= currentSession.questions.length - 1 ? 'Завершить' : 'Следующий вопрос'}
          </Button>
        ]}
        width={600}
      >
        <div className="results-content">
          <div className="score-display">
            <div className="score-circle">
              <Progress
                type="circle"
                percent={score}
                strokeColor={score > 70 ? '#52c41a' : score > 40 ? '#faad14' : '#ff4d4f'}
                size={120}
                format={() => (
                  <div>
                    <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.round(score)}</Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>/100</Text>
                  </div>
                )}
              />
            </div>
          </div>

          <div className="results-metrics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Время ответа"
                    value={recordingTime}
                    suffix="сек"
                    valueStyle={{ color: timeScore > 70 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Рекомендуемое время"
                    value={currentQuestion.estimatedTime}
                    suffix="сек"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          <div className="feedback-section">
            <Title level={5}>Обратная связь:</Title>
            {score > 80 ? (
              <Alert
                message="Отличная работа!"
                description="Ваш ответ был структурированным, полным и уложился в рекомендуемое время."
                type="success"
                showIcon
              />
            ) : score > 60 ? (
              <Alert
                message="Хорошая работа!"
                description="Ответ был хорошим, но есть возможности для улучшения."
                type="info"
                showIcon
              />
            ) : (
              <Alert
                message="Есть над чем поработать"
                description="Попробуйте структурировать ответ лучше и следить за временем."
                type="warning"
                showIcon
              />
            )}
          </div>
        </div>
      </Modal>
    );
  };

  const renderMetrics = () => (
    <Card title="Статистика практики" className="metrics-card">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Всего вопросов"
            value={practiceMetrics.totalQuestions}
            prefix={<BookOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Завершено"
            value={practiceMetrics.completedQuestions}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Средний балл"
            value={practiceMetrics.averageScore}
            suffix="/100"
            prefix={<TrophyOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Серия"
            value={practiceMetrics.streak}
            prefix={<ThunderboltOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );

  if (currentSession) {
    return (
      <div className="interview-practice">
        <div className="practice-header">
          <Title level={2} style={{ color: 'rgba(255,255,255,0.95)' }}>
            Практика интервью
          </Title>
          <Button onClick={resetSession} icon={<ReloadOutlined />}>
            Завершить сессию
          </Button>
        </div>

        {renderCurrentQuestion()}
        {renderResults()}
      </div>
    );
  }

  return (
    <div className="interview-practice">
      <div className="practice-header">
        <Title level={2} style={{ color: 'rgba(255,255,255,0.95)' }}>
          Практика интервью
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
          Оттачивайте свои навыки прохождения интервью
        </Text>
      </div>

      {renderMetrics()}

      <Card className="practice-options">
        <Title level={4} style={{ color: 'rgba(255,255,255,0.95)' }}>
          Выберите режим практики
        </Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={startPracticeSession}
            icon={<PlayCircleOutlined />}
            style={{ width: '100%' }}
          >
            Быстрая практика (3 случайных вопроса)
          </Button>
          
          <Button 
            size="large"
            onClick={() => setShowQuestionSelection(true)}
            icon={<TagOutlined />}
            style={{ width: '100%' }}
          >
            Выбрать конкретные вопросы
          </Button>
        </Space>
      </Card>

      {renderQuestionSelection()}
    </div>
  );
};

export default InterviewPractice;
