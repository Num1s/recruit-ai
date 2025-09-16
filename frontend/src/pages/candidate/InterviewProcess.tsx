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
  
  const [currentStep, setCurrentStep] = useState<InterviewStep>('upload-cv');
  const [progress, setProgress] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 минут
  const [devicePermissions, setDevicePermissions] = useState({ camera: false, microphone: false });
  
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

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
    let interval: NodeJS.Timeout;
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
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <Title level={3}>Загрузка резюме</Title>
            <Paragraph>
              Пожалуйста, загрузите ваше резюме. AI будет использовать его для создания персонализированных вопросов.
            </Paragraph>
            
            <Upload.Dragger
              name="cv"
              multiple={false}
              accept=".pdf,.docx,.doc"
              beforeUpload={handleUploadCV}
              style={{ marginBottom: 24 }}
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
        );

      case 'equipment-check':
        return (
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <Title level={3}>Проверка оборудования</Title>
            <Paragraph>
              Убедитесь, что ваша камера и микрофон работают корректно.
            </Paragraph>
            
            <div style={{ marginBottom: 24, border: '2px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
              <Webcam
                ref={webcamRef}
                audio={true}
                width="100%"
                height={300}
                screenshotFormat="image/jpeg"
              />
            </div>
            
            <Space>
              <Alert
                message={devicePermissions.camera ? "Камера работает" : "Нет доступа к камере"}
                type={devicePermissions.camera ? "success" : "error"}
                icon={<VideoCameraOutlined />}
              />
              <Alert
                message={devicePermissions.microphone ? "Микрофон работает" : "Нет доступа к микрофону"}
                type={devicePermissions.microphone ? "success" : "error"}
                icon={<AudioOutlined />}
              />
            </Space>
            
            <div style={{ marginTop: 24 }}>
              <Button type="primary" size="large" onClick={handleEquipmentCheck}>
                Всё работает → Далее
              </Button>
            </div>
          </div>
        );

      case 'language-select':
        return (
          <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
            <Title level={3}>Выбор языка интервью</Title>
            <Paragraph>
              На каком языке вы хотите проводить интервью?
            </Paragraph>
            
            <Select
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              size="large"
              style={{ width: 200, marginBottom: 24 }}
            >
              <Option value="ru">Русский</Option>
              <Option value="en">English</Option>
              <Option value="ky">Кыргызча</Option>
            </Select>
            
            <div>
              <Button type="primary" size="large" onClick={handleLanguageSelect}>
                Продолжить
              </Button>
            </div>
          </div>
        );

      case 'ai-interview':
        return (
          <div className="interview-container">
            <div className="interview-header-bar">
              <Space>
                <Text strong>Вопрос {currentQuestion + 1} из {mockQuestions.length}</Text>
                <Text>|</Text>
                <Text>Осталось: {formatTime(timeRemaining)}</Text>
              </Space>
              <Space>
                {isRecording && <Text type="danger">● Запись</Text>}
                <Button 
                  danger 
                  onClick={handleCompleteInterview}
                  icon={<StopOutlined />}
                >
                  Завершить
                </Button>
              </Space>
            </div>
            
            <div className="interview-main">
              <div className="video-section">
                <div className="candidate-video">
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="ai-avatar">
                    <Text style={{ color: 'white', fontSize: '24px' }}>AI</Text>
                  </div>
                </div>
              </div>
              
              <Card className="question-section">
                <div className="speaking-indicator">
                  <AudioOutlined />
                  <Text>AI задает вопрос...</Text>
                </div>
                
                <div className="question-text">
                  {mockQuestions[currentQuestion]?.question}
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Категория: {mockQuestions[currentQuestion]?.category}
                  </Text>
                </div>
              </Card>
              
              {!interviewStarted ? (
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<PlayCircleOutlined />}
                    onClick={startInterview}
                  >
                    Начать интервью
                  </Button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={nextQuestion}
                    disabled={currentQuestion >= mockQuestions.length - 1}
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
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <CheckCircleOutlined style={{ fontSize: '4rem', color: '#52c41a', marginBottom: '1rem' }} />
            <Title level={2}>Интервью завершено!</Title>
            <Paragraph style={{ fontSize: '16px' }}>
              Спасибо за прохождение интервью. AI проанализирует ваши ответы и подготовит детальный отчет для компании.
            </Paragraph>
            <Paragraph type="secondary">
              Результаты будут доступны в вашем личном кабинете после обработки.
            </Paragraph>
            
            <Button type="primary" size="large" onClick={handleBackToDashboard}>
              Вернуться в личный кабинет
            </Button>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentStep === 'ai-interview' ? '#1a1a1a' : '#f5f5f5' }}>
      {currentStep !== 'ai-interview' && (
        <div style={{ padding: '2rem', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToDashboard}
              type="text"
            >
              Назад к списку
            </Button>
            
            <div style={{ flex: 1, maxWidth: 600, margin: '0 2rem' }}>
              <Progress 
                percent={progress} 
                showInfo={false}
                strokeColor="#1890ff"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '12px', color: '#999' }}>
                <span>Загрузка резюме</span>
                <span>Проверка</span>
                <span>Язык</span>
                <span>Интервью</span>
              </div>
            </div>
            
            <div style={{ width: 100 }}></div>
          </div>
        </div>
      )}
      
      <div style={{ 
        padding: currentStep === 'ai-interview' ? 0 : '3rem 2rem',
        minHeight: currentStep === 'ai-interview' ? '100vh' : 'auto'
      }}>
        {renderStepContent()}
      </div>
    </div>
  );
};

export default InterviewProcess;



