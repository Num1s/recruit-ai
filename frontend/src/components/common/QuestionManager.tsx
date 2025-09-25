import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Progress, Typography, Space, Tooltip } from 'antd';
import { 
  ClockCircleOutlined, 
  BulbOutlined, 
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // в секундах
  tips?: string[];
  type?: 'behavioral' | 'technical' | 'general' | 'experience' | 'career';
  followUpQuestions?: string[];
}

interface QuestionManagerProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionComplete: (questionId: string, timeSpent: number, quality: number) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  showTips?: boolean;
  onToggleTips?: () => void;
  timeSpent?: number;
  isCompleted?: boolean;
}

interface QuestionMetrics {
  timeSpent: number;
  quality: number; // 0-100
  confidence: number; // 0-100
  completeness: number; // 0-100
}

const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  currentQuestionIndex,
  onQuestionComplete,
  onNextQuestion,
  onPreviousQuestion,
  showTips = false,
  onToggleTips,
  timeSpent = 0,
  isCompleted = false
}) => {
  const [questionMetrics, setQuestionMetrics] = useState<QuestionMetrics>({
    timeSpent: 0,
    quality: 0,
    confidence: 0,
    completeness: 0
  });

  const [showFollowUps, setShowFollowUps] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeProgress = currentQuestion 
    ? Math.min((timeSpent / currentQuestion.estimatedTime) * 100, 100)
    : 0;

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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical': return '⚙️';
      case 'behavioral': return '👥';
      case 'experience': return '💼';
      case 'general': return '💬';
      case 'career': return '🎯';
      default: return '❓';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCompleteQuestion = useCallback(() => {
    if (currentQuestion) {
      onQuestionComplete(
        currentQuestion.id,
        questionMetrics.timeSpent,
        questionMetrics.quality
      );
    }
  }, [currentQuestion, questionMetrics, onQuestionComplete]);

  const handleNextFollowUp = useCallback(() => {
    if (currentQuestion?.followUpQuestions && currentFollowUp < currentQuestion.followUpQuestions.length - 1) {
      setCurrentFollowUp(prev => prev + 1);
    } else {
      setShowFollowUps(false);
      handleCompleteQuestion();
    }
  }, [currentQuestion, currentFollowUp, handleCompleteQuestion]);

  const handleShowFollowUps = useCallback(() => {
    if (currentQuestion?.followUpQuestions && currentQuestion.followUpQuestions.length > 0) {
      setShowFollowUps(true);
      setCurrentFollowUp(0);
    }
  }, [currentQuestion]);

  // Обновляем метрики на основе времени
  useEffect(() => {
    setQuestionMetrics(prev => ({
      ...prev,
      timeSpent: timeSpent
    }));
  }, [timeSpent]);

  if (!currentQuestion) {
    return (
      <Card className="question-manager-empty">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <CheckCircleOutlined style={{ fontSize: '3rem', color: '#52c41a', marginBottom: '1rem' }} />
          <Title level={3} style={{ color: 'rgba(255,255,255,0.9)' }}>
            Все вопросы завершены!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            Интервью успешно завершено.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="question-manager">
      {/* Header with progress and controls */}
      <div className="question-manager-header">
        <div className="question-progress-section">
          <Progress
            percent={progress}
            size="small"
            strokeColor="#a8edea"
            format={() => `${currentQuestionIndex + 1}/${questions.length}`}
          />
          <div className="question-navigation">
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={onPreviousQuestion}
              size="small"
            >
              ← Назад
            </Button>
            <Button
              type="primary"
              onClick={onNextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1}
              size="small"
            >
              Далее →
            </Button>
          </div>
        </div>
        
        <div className="question-controls">
          {onToggleTips && (
            <Tooltip title={showTips ? "Скрыть подсказки" : "Показать подсказки"}>
              <Button
                type={showTips ? "primary" : "default"}
                icon={<BulbOutlined />}
                onClick={onToggleTips}
                size="small"
              />
            </Tooltip>
          )}
          
          {currentQuestion.followUpQuestions && currentQuestion.followUpQuestions.length > 0 && (
            <Tooltip title="Дополнительные вопросы">
              <Button
                icon={<QuestionCircleOutlined />}
                onClick={handleShowFollowUps}
                size="small"
              >
                Доп. вопросы
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Question content */}
      <Card className="question-content-card">
        <div className="question-header">
          <div className="question-meta">
            <Space>
              <Badge
                color={getDifficultyColor(currentQuestion.difficulty)}
                text={getDifficultyText(currentQuestion.difficulty)}
              />
              <Text type="secondary">
                {getCategoryIcon(currentQuestion.category)} {currentQuestion.category}
              </Text>
              <Text type="secondary">
                <ClockCircleOutlined /> ~{currentQuestion.estimatedTime}с
              </Text>
            </Space>
          </div>
          
          <div className="question-timer">
            <Progress
              percent={timeProgress}
              size="small"
              strokeColor={timeProgress > 80 ? '#ff4d4f' : '#a8edea'}
              showInfo={false}
              style={{ width: '100px' }}
            />
            <Text style={{ color: timeProgress > 80 ? '#ff4d4f' : '#a8edea', marginLeft: '8px' }}>
              {formatTime(timeSpent)}
            </Text>
          </div>
        </div>

        <div className="question-text">
          <Title level={4} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1rem' }}>
            {showFollowUps && currentQuestion.followUpQuestions 
              ? currentQuestion.followUpQuestions[currentFollowUp]
              : currentQuestion.question
            }
          </Title>
        </div>

        {showTips && currentQuestion.tips && (
          <div className="question-tips">
            <Title level={5} style={{ color: '#a8edea', marginBottom: '0.5rem' }}>
              💡 Подсказки:
            </Title>
            <ul style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: '20px' }}>
              {currentQuestion.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showFollowUps && (
          <div className="follow-up-navigation">
            <div className="follow-up-progress">
              <Text type="secondary">
                Дополнительный вопрос {currentFollowUp + 1} из {currentQuestion.followUpQuestions?.length}
              </Text>
            </div>
            <Button
              type="primary"
              onClick={handleNextFollowUp}
              icon={<ArrowRightOutlined />}
            >
              {currentFollowUp >= (currentQuestion.followUpQuestions?.length || 0) - 1 
                ? 'Завершить' 
                : 'Следующий доп. вопрос'
              }
            </Button>
          </div>
        )}
      </Card>

      {/* Question metrics */}
      <div className="question-metrics">
        <div className="metric-item">
          <Text type="secondary">Время:</Text>
          <Text strong style={{ color: '#a8edea' }}>
            {formatTime(questionMetrics.timeSpent)}
          </Text>
        </div>
        <div className="metric-item">
          <Text type="secondary">Качество:</Text>
          <Text strong style={{ color: questionMetrics.quality > 70 ? '#52c41a' : '#faad14' }}>
            {questionMetrics.quality}%
          </Text>
        </div>
        <div className="metric-item">
          <Text type="secondary">Уверенность:</Text>
          <Text strong style={{ color: questionMetrics.confidence > 70 ? '#52c41a' : '#faad14' }}>
            {questionMetrics.confidence}%
          </Text>
        </div>
      </div>
    </div>
  );
};

export default QuestionManager;
