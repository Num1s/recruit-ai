import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Progress, Card, Space, Modal, Upload, Select, message, Alert, Tooltip, Badge, Spin, Tabs } from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  VideoCameraOutlined, 
  AudioOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  BookOutlined,
  BarChartOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { authAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import InterviewPreparation from '../../components/interview/InterviewPreparation.tsx';
import AdvancedMetrics from '../../components/interview/AdvancedMetrics.tsx';
import SmartAIAssistant from '../../components/interview/SmartAIAssistant.tsx';
import InterviewPractice from '../../components/interview/InterviewPractice.tsx';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

type InterviewStep = 'preparation' | 'upload-cv' | 'equipment-check' | 'language-select' | 'ai-interview' | 'completed';
type InterviewPhase = 'waiting' | 'speaking' | 'listening' | 'processing' | 'completed';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // в секундах
  tips?: string[];
}

interface InterviewMetrics {
  speakingTime: number;
  listeningTime: number;
  pauseCount: number;
  averageResponseTime: number;
  confidenceScore: number;
}

interface AIFeedback {
  type: 'positive' | 'suggestion' | 'warning';
  message: string;
  timestamp: number;
}

const InterviewProcess: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<InterviewStep>('preparation');
  const [progress, setProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 минут
  const [devicePermissions, setDevicePermissions] = useState({ camera: false, microphone: false });
  const [isQuickStart, setIsQuickStart] = useState(false);
  
  // Новые состояния для улучшенного функционала
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>('waiting');
  const [isPaused, setIsPaused] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [currentQuestionTime, setCurrentQuestionTime] = useState(0);
  const [interviewMetrics, setInterviewMetrics] = useState<InterviewMetrics>({
    speakingTime: 0,
    listeningTime: 0,
    pauseCount: 0,
    averageResponseTime: 0,
    confidenceScore: 0
  });
  const [aiFeedback, setAiFeedback] = useState<AIFeedback[]>([]);
  const [showTips, setShowTips] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionProgress, setQuestionProgress] = useState(0);
  const [speechAnalysis, setSpeechAnalysis] = useState({
    isSpeaking: false,
    volume: 85,
    clarity: 88,
    pace: 82
  });
  const [interviewQuality, setInterviewQuality] = useState(0);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    averageResponseTime: 0,
    overallQuality: 0
  });

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    if (!user || !token) {
      message.error('Необходимо войти в систему');
      navigate('/login');
      return;
    }
    
    // Устанавливаем токен в API сервис
    authAPI.setAuthToken(token);
  }, [user, token, navigate]);
  
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Определяем, является ли это быстрым стартом
  useEffect(() => {
    if (invitationId === 'quick-start') {
      setIsQuickStart(true);
      // Для быстрого старта пропускаем загрузку CV и сразу переходим к проверке оборудования
      setCurrentStep('equipment-check');
    }
  }, [invitationId]);

  const mockQuestions: InterviewQuestion[] = [
    {
      id: '1',
      question: 'Расскажите о себе и вашем опыте работы в IT.',
      category: 'general',
      difficulty: 'easy',
      estimatedTime: 120,
      tips: [
        'Начните с краткого представления',
        'Расскажите о своем образовании',
        'Опишите ключевые проекты и достижения'
      ]
    },
    {
      id: '2', 
      question: 'Какие языки программирования вы используете и какой из них ваш любимый?',
      category: 'technical',
      difficulty: 'medium',
      estimatedTime: 90,
      tips: [
        'Перечислите основные языки',
        'Объясните, почему выбираете конкретный язык',
        'Приведите примеры использования'
      ]
    },
    {
      id: '3',
      question: 'Расскажите о самом сложном проекте, над которым вы работали.',
      category: 'experience',
      difficulty: 'hard',
      estimatedTime: 180,
      tips: [
        'Опишите технические вызовы',
        'Расскажите о решениях и подходах',
        'Объясните, что вы извлекли из этого опыта'
      ]
    },
    {
      id: '4',
      question: 'Как вы решаете конфликты в команде?',
      category: 'behavioral',
      difficulty: 'medium',
      estimatedTime: 120,
      tips: [
        'Приведите конкретный пример',
        'Опишите свой подход к решению конфликтов',
        'Объясните результат и уроки'
      ]
    },
    {
      id: '5',
      question: 'Где вы видите себя через 5 лет?',
      category: 'career',
      difficulty: 'easy',
      estimatedTime: 90,
      tips: [
        'Будьте реалистичны в планах',
        'Свяжите свои цели с позицией',
        'Покажите готовность к развитию'
      ]
    }
  ];

  useEffect(() => {
    // Таймер для интервью
    let interval: ReturnType<typeof setInterval>;
    if (interviewStarted && timeRemaining > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleCompleteInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStarted, timeRemaining, isPaused]);

  // Таймер для текущего вопроса
  useEffect(() => {
    let questionInterval: ReturnType<typeof setInterval>;
    if (interviewStarted && !isPaused && currentPhase === 'speaking') {
      questionInterval = setInterval(() => {
        setCurrentQuestionTime(prev => prev + 1);
        setQuestionProgress(prev => {
          const currentQ = mockQuestions[currentQuestion];
          const progress = currentQ ? (prev + (1 / currentQ.estimatedTime) * 100) : prev;
          return Math.min(progress, 100);
        });
      }, 1000);
    }
    
    return () => {
      if (questionInterval) clearInterval(questionInterval);
    };
  }, [interviewStarted, isPaused, currentPhase, currentQuestion, mockQuestions]);

  // Анализ речи
  useEffect(() => {
    let speechInterval: ReturnType<typeof setInterval>;
    if (interviewStarted && currentPhase === 'speaking') {
      speechInterval = setInterval(() => {
        // Симуляция анализа речи
        const isSpeaking = Math.random() > 0.7;
        const volume = Math.random() * 100;
        const clarity = Math.random() * 100;
        const pace = Math.random() * 100;

        setSpeechAnalysis({
          isSpeaking,
          volume,
          clarity,
          pace
        });

        // Обновляем метрики
        setInterviewMetrics(prev => ({
          ...prev,
          speakingTime: prev.speakingTime + (isSpeaking ? 3000 : 0),
          pauseCount: prev.pauseCount + (!isSpeaking && prev.speakingTime > 0 ? 1 : 0),
          confidenceScore: (prev.confidenceScore + (clarity / 10)) / 2
        }));

        // Добавляем фидбек на основе анализа
        if (volume < 30) {
          const feedback: AIFeedback = {
            type: 'suggestion',
            message: 'Попробуйте говорить немного громче для лучшей слышимости',
            timestamp: Date.now()
          };
          setAiFeedback(prev => [...prev.slice(-4), feedback]);
        }
        if (pace > 80) {
          const feedback: AIFeedback = {
            type: 'suggestion',
            message: 'Не торопитесь, говорите более размеренно',
            timestamp: Date.now()
          };
          setAiFeedback(prev => [...prev.slice(-4), feedback]);
        }
        if (clarity > 70) {
          const feedback: AIFeedback = {
            type: 'positive',
            message: 'Отлично! Ваша речь очень четкая',
            timestamp: Date.now()
          };
          setAiFeedback(prev => [...prev.slice(-4), feedback]);
        }
      }, 3000);
    }
    
    return () => {
      if (speechInterval) clearInterval(speechInterval);
    };
  }, [interviewStarted, currentPhase]);

  const addAIFeedback = useCallback((type: 'positive' | 'suggestion' | 'warning', message: string) => {
    const feedback: AIFeedback = {
      type,
      message,
      timestamp: Date.now()
    };
    setAiFeedback(prev => [...prev.slice(-4), feedback]); // Храним только последние 5 сообщений
  }, []);

  const checkDevicePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setDevicePermissions({ camera: true, microphone: true });
      stream.getTracks().forEach(track => track.stop()); // Останавливаем поток
      return true;
    } catch (error) {
      console.error('Ошибка доступа к устройствам:', error);
      message.error('Не удалось получить доступ к камере и микрофону');
      return false;
    }
  };

  const handleStepComplete = () => {
    switch (currentStep) {
      case 'preparation':
        setCurrentStep('upload-cv');
        setProgress(20);
        break;
      case 'upload-cv':
        setCurrentStep('equipment-check');
        setProgress(40);
        break;
      case 'equipment-check':
        setCurrentStep('language-select');
        setProgress(60);
        break;
      case 'language-select':
        setCurrentStep('ai-interview');
        setProgress(80);
        break;
      case 'ai-interview':
        setCurrentStep('completed');
        setProgress(100);
        break;
    }
  };

  const handleUploadCV = (file: File) => {
    // Здесь будет логика загрузки резюме
    message.success('Резюме успешно загружено');
    setTimeout(() => handleStepComplete(), 1000);
    return false; // Предотвращаем автоматическую загрузку
  };

  const handleEquipmentCheck = async () => {
    const hasPermissions = await checkDevicePermissions();
    if (hasPermissions) {
      message.success('Оборудование работает корректно');
      setTimeout(() => handleStepComplete(), 1000);
    }
  };

  const handleLanguageSelect = () => {
    message.success(`Выбран язык: ${selectedLanguage === 'ru' ? 'Русский' : 'English'}`);
    setTimeout(() => handleStepComplete(), 1000);
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setIsRecording(true);
    setCurrentPhase('speaking');
    setQuestionStartTime(Date.now());
    
    // Здесь будет логика начала записи
    if (webcamRef.current && webcamRef.current.stream) {
      const mediaRecorder = new MediaRecorder(webcamRef.current.stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
    }
    
    // Добавляем приветственный фидбек
    const welcomeFeedback: AIFeedback = {
      type: 'positive',
      message: 'Добро пожаловать на интервью! Говорите естественно и не переживайте.',
      timestamp: Date.now()
    };
    setAiFeedback(prev => [...prev.slice(-4), welcomeFeedback]);
    
    message.success('Интервью началось. Отвечайте на вопросы естественно.');
  };

  const calculateInterviewQuality = useCallback(() => {
    const avgResponseTime = interviewMetrics.averageResponseTime;
    const avgClarity = speechAnalysis.clarity;
    const avgConfidence = interviewMetrics.confidenceScore;
    
    // Рассчитываем общее качество интервью (0-100)
    const quality = Math.min(100, Math.max(0, 
      (avgClarity * 0.4) + 
      (avgConfidence * 0.3) + 
      (Math.max(0, 100 - (avgResponseTime / 1000) * 10) * 0.3)
    ));
    
    setInterviewQuality(quality);
    return quality;
  }, [interviewMetrics, speechAnalysis]);

  const generateInterviewSummary = useCallback(() => {
    const summary = {
      totalQuestions: mockQuestions.length,
      answeredQuestions: currentQuestion + 1,
      averageResponseTime: interviewMetrics.averageResponseTime / 1000,
      overallQuality: calculateInterviewQuality()
    };
    setInterviewSummary(summary);
    return summary;
  }, [mockQuestions.length, currentQuestion, interviewMetrics, calculateInterviewQuality]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < mockQuestions.length - 1) {
      // Завершаем текущий вопрос
      const questionTime = Date.now() - questionStartTime;
      setInterviewMetrics(prev => ({
        ...prev,
        speakingTime: prev.speakingTime + questionTime,
        averageResponseTime: (prev.averageResponseTime + questionTime) / 2
      }));
      
      // Обновляем качество интервью
      calculateInterviewQuality();
      
      // Переходим к следующему вопросу
      setCurrentQuestion(prev => prev + 1);
      setCurrentQuestionTime(0);
      setQuestionProgress(0);
      setQuestionStartTime(Date.now());
      setCurrentPhase('waiting');
      
      // Добавляем фидбек
      const currentQ = mockQuestions[currentQuestion];
      if (currentQ) {
        const feedback: AIFeedback = {
          type: 'positive',
          message: `Отлично! Переходим к следующему вопросу: "${currentQ.category}"`,
          timestamp: Date.now()
        };
        setAiFeedback(prev => [...prev.slice(-4), feedback]);
      }
    } else {
      generateInterviewSummary();
      handleCompleteInterview();
    }
  }, [currentQuestion, questionStartTime, calculateInterviewQuality, generateInterviewSummary]);

  const handleCompleteInterview = () => {
    setIsRecording(false);
    setInterviewStarted(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    handleStepComplete();
  };

  const handleTestComplete = async () => {
    // Проверяем авторизацию
    if (!user || !token) {
      message.error('Необходимо войти в систему');
      navigate('/login');
      return;
    }

    // Тестовое завершение интервью с отправкой на анализ
    setIsRecording(false);
    setInterviewStarted(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    // Отправляем интервью на анализ
    try {
      if (invitationId && invitationId !== 'quick-start') {
        const interviewDuration = 600 - timeRemaining; // Время, потраченное на интервью
        const questionsAnswered = currentQuestion + 1;
        
        // Убеждаемся, что токен установлен
        authAPI.setAuthToken(token);
        
        console.log('Отправка интервью на анализ:', {
          invitationId: parseInt(invitationId),
          interviewDuration,
          questionsAnswered,
          user: user?.id,
          hasCandidateProfile: !!user?.candidate_profile
        });
        
        await authAPI.analyzeInterview(
          parseInt(invitationId),
          interviewDuration,
          questionsAnswered
        );
        
        message.success('Интервью отправлено на анализ ИИ!');
      } else {
        message.info('Тестовое интервью завершено');
      }
      
      handleStepComplete();
    } catch (error: any) {
      console.error('Ошибка при отправке на анализ:', error);
      if (error.response?.status === 401) {
        message.error('Сессия истекла. Пожалуйста, войдите в систему заново');
        navigate('/login');
      } else {
        message.error('Ошибка при отправке интервью на анализ');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Новые функции для улучшенного функционала
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

  const pauseInterview = useCallback(() => {
    setIsPaused(true);
    setCurrentPhase('waiting');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    message.info('Интервью приостановлено');
  }, []);

  const resumeInterview = useCallback(() => {
    setIsPaused(false);
    setCurrentPhase('speaking');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    message.success('Интервью возобновлено');
  }, []);

  const resetQuestion = useCallback(() => {
    setCurrentQuestionTime(0);
    setQuestionProgress(0);
    setQuestionStartTime(Date.now());
    setCurrentPhase('waiting');
    const feedback: AIFeedback = {
      type: 'suggestion',
      message: 'Готовы начать заново? Не торопитесь, подумайте над ответом.',
      timestamp: Date.now()
    };
    setAiFeedback(prev => [...prev.slice(-4), feedback]);
  }, []);

  const previewNextQuestion = useCallback(() => {
    if (currentQuestion < mockQuestions.length - 1) {
      setShowQuestionPreview(true);
      setTimeout(() => setShowQuestionPreview(false), 3000);
    }
  }, [currentQuestion, mockQuestions.length]);

  const startQuestionTransition = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      nextQuestion();
    }, 1000);
  }, []);


  const handleBackToDashboard = () => {
    navigate('/candidate/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'preparation':
        return <InterviewPreparation onComplete={handleStepComplete} />;
        
      case 'upload-cv':
        return (
          <div className="interview-step-container">
            <Card className="interview-step-card">
              <div className="interview-step-content">
                <Title level={3} className="interview-step-title">Загрузка резюме</Title>
                <Paragraph className="interview-step-description">
                  Пожалуйста, загрузите ваше резюме. AI будет использовать его для создания персонализированных вопросов.
                </Paragraph>
                
                <Upload.Dragger
                  name="cv"
                  multiple={false}
                  accept=".pdf,.docx,.doc"
                  beforeUpload={handleUploadCV}
                  className="interview-upload-dragger"
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Нажмите или перетащите файл для загрузки</p>
                  <p className="ant-upload-hint">
                    Поддерживаются форматы: PDF, DOCX, DOC
                  </p>
                </Upload.Dragger>
              </div>
            </Card>
          </div>
        );

      case 'equipment-check':
        return (
          <div className="interview-step-container">
            <Card className="interview-step-card">
              <div className="interview-step-content">
                <Title level={3} className="interview-step-title">Проверка оборудования</Title>
                <Paragraph className="interview-step-description">
                  Убедитесь, что ваша камера и микрофон работают корректно.
                </Paragraph>
                
                <div className="interview-webcam-container">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    width="100%"
                    height={300}
                    screenshotFormat="image/jpeg"
                  />
                </div>
                
                <Space className="interview-device-status">
                  <Alert
                    message={devicePermissions.camera ? "Камера работает" : "Нет доступа к камере"}
                    type={devicePermissions.camera ? "success" : "error"}
                    icon={<VideoCameraOutlined />}
                    className="interview-device-alert"
                  />
                  <Alert
                    message={devicePermissions.microphone ? "Микрофон работает" : "Нет доступа к микрофону"}
                    type={devicePermissions.microphone ? "success" : "error"}
                    icon={<AudioOutlined />}
                    className="interview-device-alert"
                  />
                </Space>
                
                <div className="interview-step-actions">
                  <Button type="primary" size="large" onClick={handleEquipmentCheck} className="interview-next-button">
                    Всё работает → Далее
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'language-select':
        return (
          <div className="interview-step-container">
            <Card className="interview-step-card">
              <div className="interview-step-content">
                <Title level={3} className="interview-step-title">Выбор языка интервью</Title>
                <Paragraph className="interview-step-description">
                  На каком языке вы хотите проводить интервью?
                </Paragraph>
                
                <Select
                  value={selectedLanguage}
                  onChange={setSelectedLanguage}
                  size="large"
                  className="interview-language-select"
                >
                  <Option value="ru">Русский</Option>
                  <Option value="en">English</Option>
                  <Option value="ky">Кыргызча</Option>
                </Select>
                
                <div className="interview-step-actions">
                  <Button type="primary" size="large" onClick={handleLanguageSelect} className="interview-next-button">
                    Продолжить
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'ai-interview':
        const currentQ = mockQuestions[currentQuestion];
        const nextQ = mockQuestions[currentQuestion + 1];
        return (
          <div className="interview-fullscreen-container">
            {/* Enhanced Header */}
            <div className="interview-fullscreen-header">
              <div className="interview-header-left">
                <div className="interview-progress-indicator">
                  <div className="interview-progress-circle">
                    <Progress
                      type="circle"
                      percent={((currentQuestion + 1) / mockQuestions.length) * 100}
                      size={50}
                      strokeColor="#a8edea"
                      trailColor="rgba(255,255,255,0.1)"
                      format={() => `${currentQuestion + 1}/${mockQuestions.length}`}
                    />
                  </div>
                  <div className="interview-progress-info">
                    <Text strong className="interview-question-counter">
                      Вопрос {currentQuestion + 1} из {mockQuestions.length}
                    </Text>
                    <Badge 
                      color={getDifficultyColor(currentQ?.difficulty || 'medium')}
                      text={getDifficultyText(currentQ?.difficulty || 'medium')}
                    />
                  </div>
                </div>
                
                <div className="interview-timer-section">
                  <div className="timer-item">
                    <ClockCircleOutlined style={{ color: '#a8edea' }} />
                    <Text className="interview-timer">Общее время: {formatTime(timeRemaining)}</Text>
                  </div>
                  {currentQuestionTime > 0 && (
                    <div className="timer-item">
                      <ClockCircleOutlined style={{ color: '#52c41a' }} />
                      <Text style={{ color: '#52c41a' }}>
                        Время на вопрос: {formatTime(currentQuestionTime)}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="interview-header-right">
                <div className="interview-status-indicators">
                  {isRecording && (
                    <div className="status-indicator recording">
                      <div className="status-dot"></div>
                      <Text>Запись</Text>
                    </div>
                  )}
                  {isPaused && (
                    <div className="status-indicator paused">
                      <div className="status-dot"></div>
                      <Text>Приостановлено</Text>
                    </div>
                  )}
                  <div className="quality-indicator">
                    <Text>Качество: </Text>
                    <Progress
                      percent={interviewQuality}
                      size="small"
                      strokeColor={interviewQuality > 70 ? '#52c41a' : interviewQuality > 40 ? '#faad14' : '#ff4d4f'}
                      showInfo={false}
                      style={{ width: '60px' }}
                    />
                    <Text style={{ color: interviewQuality > 70 ? '#52c41a' : interviewQuality > 40 ? '#faad14' : '#ff4d4f' }}>
                      {Math.round(interviewQuality)}%
                    </Text>
                  </div>
                </div>
                
                <div className="interview-control-buttons">
                  <Tooltip title="Показать подсказки">
                    <Button 
                      type={showTips ? "primary" : "default"}
                      icon={<BulbOutlined />}
                      onClick={() => setShowTips(!showTips)}
                      size="small"
                      className="control-button"
                    />
                  </Tooltip>
                  
                  <Tooltip title="Предварительный просмотр следующего вопроса">
                    <Button 
                      icon={<EyeOutlined />}
                      onClick={previewNextQuestion}
                      size="small"
                      className="control-button"
                      disabled={currentQuestion >= mockQuestions.length - 1}
                    />
                  </Tooltip>
                  
                  <Tooltip title="Перезапустить вопрос">
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={resetQuestion}
                      size="small"
                      className="control-button"
                    />
                  </Tooltip>
                  
                  {isPaused ? (
                    <Button 
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={resumeInterview}
                      size="small"
                      className="control-button"
                    >
                      Продолжить
                    </Button>
                  ) : (
                    <Button 
                      icon={<PauseCircleOutlined />}
                      onClick={pauseInterview}
                      size="small"
                      className="control-button"
                    >
                      Пауза
                    </Button>
                  )}
                  
                  <Button 
                    type="primary"
                    onClick={handleTestComplete}
                    icon={<CheckCircleOutlined />}
                    size="small"
                    className="control-button"
                  >
                    Завершить
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Main Interview Area */}
            <div className="interview-fullscreen-main">
              <div className="interview-content-layout-enhanced">
                        {/* Left Side - Video and AI */}
                        <div className="interview-video-section-enhanced">
                  <div className="video-container">
                    <div className="interview-candidate-video">
                      <Webcam
                        ref={webcamRef}
                        audio={true}
                        width="100%"
                        height="100%"
                        style={{ 
                          objectFit: 'cover',
                          borderRadius: '12px',
                          filter: 'brightness(1.1) contrast(1.2) saturate(1.1)'
                        }}
                        videoConstraints={{
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                          facingMode: 'user',
                          frameRate: { ideal: 30, max: 60 }
                        }}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={0.9}
                      />
                      {speechAnalysis.isSpeaking && (
                        <div className="interview-speaking-indicator-overlay">
                          <div className="speaking-animation">
                            <SoundOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                          </div>
                          <Text style={{ color: '#52c41a', marginLeft: '12px', fontWeight: '500' }}>
                            Говорите...
                          </Text>
                        </div>
                      )}
                      
                      {/* Enhanced Video Quality Indicator */}
                      <div className="video-quality-indicator">
                        <div className="quality-info">
                          <div className="quality-metrics">
                            <div className="quality-item">
                              <div className="quality-label">Качество видео</div>
                              <div className="quality-value">
                                {Math.round(speechAnalysis.clarity)}%
                              </div>
                            </div>
                            <div className="quality-item">
                              <div className="quality-label">Разрешение</div>
                              <div className="quality-value">HD</div>
                            </div>
                            <div className="quality-item">
                              <div className="quality-label">FPS</div>
                              <div className="quality-value">30</div>
                            </div>
                          </div>
                          <div className="quality-bar">
                            <div 
                              className="quality-fill" 
                              style={{ 
                                width: `${Math.max(speechAnalysis.clarity, 75)}%`,
                                backgroundColor: speechAnalysis.clarity > 70 ? '#52c41a' : 
                                               speechAnalysis.clarity > 40 ? '#faad14' : '#ff4d4f'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="interview-ai-avatar-container">
                      <div className="interview-ai-avatar">
                        <div className="ai-avatar-inner">
                          <div className="ai-avatar-icon">
                            <RobotOutlined style={{ fontSize: '24px', color: '#a8edea' }} />
                          </div>
                          {currentPhase === 'speaking' && (
                            <div className="ai-listening-animation">
                              <div className="listening-dot"></div>
                              <div className="listening-dot"></div>
                              <div className="listening-dot"></div>
                            </div>
                          )}
                          {currentPhase === 'waiting' && (
                            <div className="ai-ready-indicator">
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="interview-ai-status">
                        <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                          {currentPhase === 'speaking' ? 'Анализирую речь...' : 
                           currentPhase === 'waiting' ? 'Готов к интервью' : 
                           currentPhase === 'processing' ? 'Обрабатываю ответ...' : 'Готов'}
                        </Text>
                        <div className="ai-confidence-score">
                          <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            Уверенность: {Math.round(interviewMetrics.confidenceScore)}%
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
                {/* Right Side - Question and Controls */}
                <div className="interview-question-section-enhanced">
                  {/* AI Assistant */}
                  <SmartAIAssistant 
                    currentQuestion={currentQ?.question}
                    speechMetrics={{
                      volume: speechAnalysis.volume,
                      clarity: speechAnalysis.clarity,
                      pace: speechAnalysis.pace,
                      confidence: interviewMetrics.confidenceScore
                    }}
                    performanceMetrics={{
                      responseTime: interviewMetrics.averageResponseTime / 1000,
                      completeness: 80,
                      relevance: 85
                    }}
                    interviewPhase={currentPhase === 'completed' ? 'waiting' : currentPhase}
                  />
                  <Card className="interview-question-card">
                    <div className="interview-question-header">
                      <div className="question-meta">
                        <Space>
                          <Badge 
                            color={getDifficultyColor(currentQ?.difficulty || 'medium')}
                            text={getDifficultyText(currentQ?.difficulty || 'medium')}
                          />
                          <Text type="secondary">
                            {currentQ?.category} • ~{currentQ?.estimatedTime}с
                          </Text>
                        </Space>
                      </div>
                      <div className="question-progress">
                        <Progress 
                          percent={questionProgress} 
                          size="small" 
                          strokeColor="#a8edea"
                          showInfo={false}
                        />
                        <Text style={{ color: '#a8edea', fontSize: '12px' }}>
                          Прогресс: {Math.round(questionProgress)}%
                        </Text>
                      </div>
                    </div>
                    
                    <div className="interview-question-text">
                      <Title level={3} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1rem' }}>
                        {currentQ?.question}
                      </Title>
                    </div>
                    
                    {showTips && currentQ?.tips && (
                      <div className="interview-tips-section">
                        <div className="tips-header">
                          <BulbOutlined style={{ color: '#a8edea', marginRight: '8px' }} />
                          <Text strong style={{ color: '#a8edea' }}>Подсказки для ответа:</Text>
                        </div>
                        <div className="tips-content">
                          {currentQ.tips.map((tip, index) => (
                            <div key={index} className="tip-item">
                              <div className="tip-number">{index + 1}</div>
                              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{tip}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Next Question Preview */}
                  {showQuestionPreview && nextQ && (
                    <Card className="next-question-preview">
                      <div className="preview-header">
                        <Text strong style={{ color: '#a8edea' }}>Следующий вопрос:</Text>
                      </div>
                      <div className="preview-content">
                        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                          {nextQ.question}
                        </Text>
                        <div className="preview-meta">
                          <Badge 
                            color={getDifficultyColor(nextQ.difficulty)}
                            text={getDifficultyText(nextQ.difficulty)}
                          />
                          <Text type="secondary" style={{ marginLeft: '8px' }}>
                            {nextQ.category} • ~{nextQ.estimatedTime}с
                          </Text>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              
              {/* Enhanced Controls */}
              <div className="interview-controls-section">
                {!interviewStarted ? (
                  <div className="interview-start-controls">
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<PlayCircleOutlined />}
                      onClick={startInterview}
                      className="interview-start-button"
                    >
                      Начать интервью
                    </Button>
                    <div className="start-info">
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                        Готовы? Нажмите кнопку, чтобы начать запись и ответить на вопросы
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="interview-active-controls">
                    <div className="main-controls">
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={startQuestionTransition}
                        disabled={isTransitioning}
                        className="interview-next-question-button"
                        icon={isTransitioning ? <Spin size="small" /> : <ArrowRightOutlined />}
                      >
                        {isTransitioning ? 'Переход...' : 
                         currentQuestion >= mockQuestions.length - 1 ? 'Завершить интервью' : 'Следующий вопрос'}
                      </Button>
                    </div>
                    
                    <div className="secondary-controls">
                      <Space size="small">
                        <Button 
                          icon={<QuestionCircleOutlined />}
                          onClick={() => setShowTips(!showTips)}
                          type={showTips ? "primary" : "default"}
                          size="small"
                        >
                          {showTips ? 'Скрыть' : 'Показать'} подсказки
                        </Button>
                        
                        {currentQuestion < mockQuestions.length - 1 && (
                          <Button 
                            icon={<EyeOutlined />}
                            onClick={previewNextQuestion}
                            size="small"
                          >
                            Предпросмотр
                          </Button>
                        )}
                      </Space>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="interview-step-container">
            <Card className="interview-step-card">
              <div className="interview-step-content">
                <CheckCircleOutlined className="interview-completion-icon" />
                <Title level={2} className="interview-step-title">Интервью завершено!</Title>
                <Paragraph className="interview-step-description">
                  Спасибо за прохождение интервью. AI проанализирует ваши ответы и подготовит детальный отчет для компании.
                </Paragraph>
                <Paragraph type="secondary" className="interview-completion-note">
                  Результаты будут доступны в вашем личном кабинете после обработки.
                </Paragraph>
                
                <div className="interview-step-actions">
                  <Button type="primary" size="large" onClick={handleBackToDashboard} className="interview-next-button">
                    Вернуться в личный кабинет
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="interview-container">
      {currentStep !== 'ai-interview' && (
        <div className="interview-header">
          <div className="interview-header-content">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToDashboard}
              className="interview-back-button"
            >
              Назад к списку
            </Button>
            
            <div className="interview-progress-section">
              <Progress 
                percent={progress} 
                showInfo={false}
                strokeColor="#a8edea"
                trailColor="rgba(255, 255, 255, 0.1)"
                className="interview-progress"
              />
              <div className="interview-progress-labels">
                <span>Подготовка</span>
                <span>Резюме</span>
                <span>Проверка</span>
                <span>Язык</span>
                <span>Интервью</span>
              </div>
            </div>
            
            <div className="interview-header-spacer"></div>
          </div>
        </div>
      )}
      
      <div className={`interview-content ${currentStep === 'ai-interview' ? 'interview-content-fullscreen' : ''}`}>
        {renderStepContent()}
      </div>
    </div>
  );
};

export default InterviewProcess;



