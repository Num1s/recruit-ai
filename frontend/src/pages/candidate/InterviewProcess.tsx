import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Progress, Card, Space, Modal, Upload, Select, message, Alert } from 'antd';
import { 
  ArrowLeftOutlined, 
  VideoCameraOutlined, 
  AudioOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { authAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

type InterviewStep = 'upload-cv' | 'equipment-check' | 'language-select' | 'ai-interview' | 'completed';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
}

const InterviewProcess: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<InterviewStep>('upload-cv');
  const [progress, setProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 минут
  const [devicePermissions, setDevicePermissions] = useState({ camera: false, microphone: false });
  const [isQuickStart, setIsQuickStart] = useState(false);

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
      category: 'general'
    },
    {
      id: '2', 
      question: 'Какие языки программирования вы используете и какой из них ваш любимый?',
      category: 'technical'
    },
    {
      id: '3',
      question: 'Расскажите о самом сложном проекте, над которым вы работали.',
      category: 'experience'
    },
    {
      id: '4',
      question: 'Как вы решаете конфликты в команде?',
      category: 'behavioral'
    },
    {
      id: '5',
      question: 'Где вы видите себя через 5 лет?',
      category: 'career'
    }
  ];

  useEffect(() => {
    // Таймер для интервью
    let interval: ReturnType<typeof setInterval>;
    if (interviewStarted && timeRemaining > 0) {
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
  }, [interviewStarted, timeRemaining]);

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
      case 'upload-cv':
        setCurrentStep('equipment-check');
        setProgress(25);
        break;
      case 'equipment-check':
        setCurrentStep('language-select');
        setProgress(50);
        break;
      case 'language-select':
        setCurrentStep('ai-interview');
        setProgress(75);
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
    
    message.success('Интервью началось. Отвечайте на вопросы естественно.');
  };

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleCompleteInterview();
    }
  };

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

  const handleBackToDashboard = () => {
    navigate('/candidate/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
        return (
          <div className="interview-fullscreen-container">
            <div className="interview-fullscreen-header">
              <Space>
                <Text strong className="interview-question-counter">Вопрос {currentQuestion + 1} из {mockQuestions.length}</Text>
                <Text className="interview-separator">|</Text>
                <Text className="interview-timer">Осталось: {formatTime(timeRemaining)}</Text>
              </Space>
              <Space>
                {isRecording && <Text type="danger" className="interview-recording-indicator">● Запись</Text>}
                <Button 
                  type="primary"
                  onClick={handleTestComplete}
                  icon={<CheckCircleOutlined />}
                  className="interview-test-button"
                >
                  Тест
                </Button>
                <Button 
                  danger 
                  onClick={handleCompleteInterview}
                  icon={<StopOutlined />}
                  className="interview-complete-button"
                >
                  Завершить
                </Button>
              </Space>
            </div>
            
            <div className="interview-fullscreen-main">
              <div className="interview-video-section">
                <div className="interview-candidate-video">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                
                <div className="interview-ai-avatar-container">
                  <div className="interview-ai-avatar">
                    <Text className="interview-ai-text">AI</Text>
                  </div>
                </div>
              </div>
              
              <Card className="interview-question-card">
                <div className="interview-speaking-indicator">
                  <AudioOutlined />
                  <Text>AI задает вопрос...</Text>
                </div>
                
                <div className="interview-question-text">
                  {mockQuestions[currentQuestion]?.question}
                </div>
                
                <div className="interview-question-category">
                  <Text type="secondary">
                    Категория: {mockQuestions[currentQuestion]?.category}
                  </Text>
                </div>
              </Card>
              
              {!interviewStarted ? (
                <div className="interview-controls">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<PlayCircleOutlined />}
                    onClick={startInterview}
                    className="interview-start-button"
                  >
                    Начать интервью
                  </Button>
                </div>
              ) : (
                <div className="interview-controls">
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={nextQuestion}
                    disabled={currentQuestion >= mockQuestions.length - 1}
                    className="interview-next-question-button"
                  >
                    Следующий вопрос
                  </Button>
                </div>
              )}
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
                <span>Загрузка резюме</span>
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



