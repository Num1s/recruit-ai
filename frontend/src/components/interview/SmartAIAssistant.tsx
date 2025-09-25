import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Space, Avatar, Badge, Button, Tooltip, List, Progress, Alert, Modal } from 'antd';
import { 
  RobotOutlined, 
  BulbOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  StarOutlined,
  MessageOutlined,
  SoundOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  SendOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AIFeedback {
  id: string;
  type: 'positive' | 'suggestion' | 'warning' | 'motivation' | 'tip';
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  category: 'speech' | 'content' | 'behavior' | 'general';
  actionable?: boolean;
  actionText?: string;
  onAction?: () => void;
}

interface SmartAIAssistantProps {
  currentQuestion?: string;
  speechMetrics?: {
    volume: number;
    clarity: number;
    pace: number;
    confidence: number;
  };
  performanceMetrics?: {
    responseTime: number;
    completeness: number;
    relevance: number;
  };
  interviewPhase?: 'waiting' | 'speaking' | 'listening' | 'processing';
  onFeedbackAction?: (feedbackId: string, action: string) => void;
}

const SmartAIAssistant: React.FC<SmartAIAssistantProps> = ({
  currentQuestion,
  speechMetrics,
  performanceMetrics,
  interviewPhase = 'waiting',
  onFeedbackAction
}) => {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [assistantMood, setAssistantMood] = useState<'encouraging' | 'analytical' | 'supportive'>('encouraging');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: number;
  }>>([]);

  // Генерация умных подсказок на основе метрик
  const generateSmartFeedback = useCallback(() => {
    const newFeedback: AIFeedback[] = [];

    // Анализ речи
    if (speechMetrics) {
      if (speechMetrics.volume < 40) {
        newFeedback.push({
          id: `volume-${Date.now()}`,
          type: 'suggestion',
          message: 'Попробуйте говорить немного громче. Это поможет интервьюеру лучше вас слышать.',
          timestamp: Date.now(),
          priority: 'medium',
          category: 'speech',
          actionable: true,
          actionText: 'Проверить микрофон',
          onAction: () => onFeedbackAction?.(`volume-${Date.now()}`, 'check_microphone')
        });
      }

      if (speechMetrics.pace > 80) {
        newFeedback.push({
          id: `pace-${Date.now()}`,
          type: 'suggestion',
          message: 'Не торопитесь! Говорите более размеренно, чтобы ваши мысли были понятны.',
          timestamp: Date.now(),
          priority: 'medium',
          category: 'speech',
          actionable: true,
          actionText: 'Сделать паузу',
          onAction: () => onFeedbackAction?.(`pace-${Date.now()}`, 'take_pause')
        });
      }

      if (speechMetrics.clarity > 75) {
        newFeedback.push({
          id: `clarity-${Date.now()}`,
          type: 'positive',
          message: 'Отлично! Ваша речь очень четкая и понятная.',
          timestamp: Date.now(),
          priority: 'low',
          category: 'speech'
        });
      }
    }

    // Анализ производительности
    if (performanceMetrics) {
      if (performanceMetrics.responseTime > 8) {
        newFeedback.push({
          id: `response-${Date.now()}`,
          type: 'suggestion',
          message: 'Попробуйте отвечать быстрее. Небольшая пауза для размышления - это нормально, но не затягивайте.',
          timestamp: Date.now(),
          priority: 'medium',
          category: 'behavior',
          actionable: true,
          actionText: 'Начать отвечать',
          onAction: () => onFeedbackAction?.(`response-${Date.now()}`, 'start_answering')
        });
      }

      if (performanceMetrics.completeness < 50) {
        newFeedback.push({
          id: `completeness-${Date.now()}`,
          type: 'tip',
          message: 'Попробуйте давать более развернутые ответы. Расскажите больше деталей и примеров.',
          timestamp: Date.now(),
          priority: 'high',
          category: 'content',
          actionable: true,
          actionText: 'Расширить ответ',
          onAction: () => onFeedbackAction?.(`completeness-${Date.now()}`, 'expand_answer')
        });
      }
    }

    // Контекстные подсказки
    if (currentQuestion) {
      if (currentQuestion.toLowerCase().includes('опыт') || currentQuestion.toLowerCase().includes('проект')) {
        newFeedback.push({
          id: `experience-${Date.now()}`,
          type: 'tip',
          message: 'Используйте метод STAR: Ситуация, Задача, Действие, Результат для рассказа о вашем опыте.',
          timestamp: Date.now(),
          priority: 'medium',
          category: 'content'
        });
      }

      if (currentQuestion.toLowerCase().includes('слабост') || currentQuestion.toLowerCase().includes('недостатк')) {
        newFeedback.push({
          id: `weakness-${Date.now()}`,
          type: 'tip',
          message: 'Говорите о слабостях честно, но покажите, как вы работаете над их улучшением.',
          timestamp: Date.now(),
          priority: 'high',
          category: 'content'
        });
      }
    }

    // Мотивационные сообщения
    if (Math.random() > 0.7) {
      const motivationalMessages = [
        'Вы отлично справляетесь! Продолжайте в том же духе.',
        'Ваша уверенность растет с каждым ответом. Это заметно!',
        'Отличная работа! Вы показываете хорошие результаты.',
        'Не переживайте, вы делаете все правильно. Расслабьтесь и говорите естественно.'
      ];

      newFeedback.push({
        id: `motivation-${Date.now()}`,
        type: 'motivation',
        message: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
        timestamp: Date.now(),
        priority: 'low',
        category: 'general'
      });
    }

    return newFeedback;
  }, [speechMetrics, performanceMetrics, currentQuestion, onFeedbackAction]);

  // Обновление настроения ассистента
  useEffect(() => {
    const avgMetrics = speechMetrics ? 
      (speechMetrics.volume + speechMetrics.clarity + speechMetrics.confidence) / 3 : 50;
    
    if (avgMetrics > 70) {
      setAssistantMood('encouraging');
    } else if (avgMetrics > 40) {
      setAssistantMood('analytical');
    } else {
      setAssistantMood('supportive');
    }
  }, [speechMetrics]);

  // Генерация фидбека при изменении метрик
  useEffect(() => {
    if (interviewPhase === 'speaking') {
      const newFeedback = generateSmartFeedback();
      if (newFeedback.length > 0) {
        setIsTyping(true);
        setTimeout(() => {
          setFeedback(prev => [...prev.slice(-4), ...newFeedback]);
          setIsTyping(false);
        }, 1000);
      }
    }
  }, [speechMetrics, performanceMetrics, interviewPhase, generateSmartFeedback]);

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'suggestion': return <BulbOutlined style={{ color: '#faad14' }} />;
      case 'warning': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'motivation': return <HeartOutlined style={{ color: '#eb2f96' }} />;
      case 'tip': return <ThunderboltOutlined style={{ color: '#722ed1' }} />;
      default: return <MessageOutlined />;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'positive': return '#52c41a';
      case 'suggestion': return '#faad14';
      case 'warning': return '#ff4d4f';
      case 'motivation': return '#eb2f96';
      case 'tip': return '#722ed1';
      default: return '#1890ff';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#1890ff';
    }
  };

  const getAssistantAvatar = () => {
    switch (assistantMood) {
      case 'encouraging': return '😊';
      case 'analytical': return '🤔';
      case 'supportive': return '🤗';
      default: return '🤖';
    }
  };

  const handleChatMessage = (message: string) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      message,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Симуляция ответа AI
    setTimeout(() => {
      const aiResponses = [
        'Я здесь, чтобы помочь вам пройти интервью успешно!',
        'Отличный вопрос! Давайте разберем это вместе.',
        'Не переживайте, у вас все получается!',
        'Помните, что интервью - это диалог, а не экзамен.',
        'Ваша уверенность растет с каждым ответом!'
      ];

      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai' as const,
        message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const renderFeedbackItem = (item: AIFeedback) => (
    <div 
      key={item.id} 
      className={`ai-feedback-item ai-feedback-${item.type}`}
      style={{ 
        borderLeft: `4px solid ${getFeedbackColor(item.type)}`,
        backgroundColor: `${getFeedbackColor(item.type)}10`
      }}
    >
      <div className="feedback-header">
        <Space>
          {getFeedbackIcon(item.type)}
          <Text strong style={{ color: getFeedbackColor(item.type) }}>
            {item.type === 'positive' ? 'Отлично!' :
             item.type === 'suggestion' ? 'Совет' :
             item.type === 'warning' ? 'Внимание' :
             item.type === 'motivation' ? 'Поддержка' : 'Подсказка'}
          </Text>
          <Badge 
            color={getPriorityColor(item.priority)} 
            text={item.priority}
            size="small"
          />
        </Space>
      </div>
      
      <div className="feedback-content">
        <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
          {item.message}
        </Text>
      </div>

      {item.actionable && item.actionText && (
        <div className="feedback-action">
          <Button 
            type="primary" 
            size="small"
            onClick={item.onAction}
            style={{ 
              backgroundColor: getFeedbackColor(item.type),
              borderColor: getFeedbackColor(item.type)
            }}
          >
            {item.actionText}
          </Button>
        </div>
      )}

      <div className="feedback-timestamp">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </div>
    </div>
  );

  const renderChatModal = () => (
    <Modal
      title={
        <Space>
          <Avatar style={{ backgroundColor: '#a8edea' }}>
            {getAssistantAvatar()}
          </Avatar>
          <Text style={{ color: 'rgba(255,255,255,0.95)' }}>
            AI Помощник
          </Text>
        </Space>
      }
      open={showChat}
      onCancel={() => setShowChat(false)}
      footer={null}
      width={500}
      className="ai-chat-modal"
    >
      <div className="chat-messages">
        {chatMessages.map(message => (
          <div 
            key={message.id} 
            className={`chat-message ${message.type}`}
          >
            <div className="message-content">
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                {message.message}
              </Text>
            </div>
            <div className="message-time">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <Button 
          type="primary" 
          onClick={() => handleChatMessage('Как мне лучше отвечать на вопросы?')}
          icon={<SendOutlined />}
        >
          Задать вопрос
        </Button>
      </div>
    </Modal>
  );

  return (
    <div className="smart-ai-assistant">
      <Card 
        title={
          <Space>
            <Avatar style={{ backgroundColor: '#a8edea' }}>
              {getAssistantAvatar()}
            </Avatar>
            <Text style={{ color: 'rgba(255,255,255,0.95)' }}>
              AI Помощник
            </Text>
            {isTyping && (
              <Badge 
                status="processing" 
                text="Анализирую..."
                style={{ color: 'rgba(255,255,255,0.7)' }}
              />
            )}
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Чат с AI">
              <Button 
                type="text" 
                icon={<MessageOutlined />}
                onClick={() => setShowChat(true)}
              />
            </Tooltip>
            <Tooltip title="Скрыть помощника">
              <Button 
                type="text" 
                icon={<CloseOutlined />}
              />
            </Tooltip>
          </Space>
        }
        className="ai-assistant-card"
      >
        <div className="assistant-status">
          <Space>
            <Text type="secondary">Настроение:</Text>
            <Badge 
              color={assistantMood === 'encouraging' ? '#52c41a' : 
                     assistantMood === 'analytical' ? '#faad14' : '#1890ff'}
              text={assistantMood === 'encouraging' ? 'Поощряющий' :
                    assistantMood === 'analytical' ? 'Аналитический' : 'Поддерживающий'}
            />
          </Space>
        </div>

        <div className="feedback-list">
          {feedback.length > 0 ? (
            feedback.slice(-3).map(renderFeedbackItem)
          ) : (
            <div className="no-feedback">
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                AI анализирует ваши ответы и готов дать советы...
              </Text>
            </div>
          )}
        </div>

        {interviewPhase === 'speaking' && (
          <Alert
            message="Говорите естественно"
            description="AI отслеживает качество вашей речи и даст советы по улучшению"
            type="info"
            showIcon
            style={{ marginTop: '1rem' }}
          />
        )}
      </Card>

      {renderChatModal()}
    </div>
  );
};

export default SmartAIAssistant;
