import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Tag, Space, Avatar, Dropdown, Menu, Upload, message, Modal, Tabs } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined, 
  UploadOutlined, 
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import authAPI from '../../services/api.ts';
import NotificationCenter from '../../components/candidate/NotificationCenter.tsx';
import InterviewHistory from '../../components/candidate/InterviewHistory.tsx';

const { Title, Text, Paragraph } = Typography;

interface InterviewInvitation {
  id: string;
  company_name: string;
  job_title: string;
  status: 'sent' | 'accepted' | 'in_progress' | 'completed' | 'reviewed';
  expires_at: string;
  invited_at: string;
  job_description?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<InterviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('invitations');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      // Пока используем моковые данные
      const mockInvitations: InterviewInvitation[] = [
        {
          id: '1',
          company_name: 'TechCorp Кыргызстан',
          job_title: 'Senior Frontend Developer',
          status: 'sent',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 часа
          invited_at: new Date().toISOString(),
          job_description: 'Разработка современных веб-приложений на React/TypeScript'
        },
        {
          id: '2',
          company_name: 'FinTech Solutions',
          job_title: 'Python Backend Developer',
          status: 'completed',
          expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          invited_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          job_description: 'Разработка финтех решений на Python/FastAPI'
        },
        {
          id: '3',
          company_name: 'Digital Bank KG',
          job_title: 'Full Stack Developer',
          status: 'reviewed',
          expires_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          invited_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          job_description: 'Создание банковских цифровых сервисов'
        }
      ];
      
      setInvitations(mockInvitations);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'blue';
      case 'accepted': return 'orange';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'reviewed': return 'purple';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Приглашение';
      case 'accepted': return 'Принято';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Выполнено';
      case 'reviewed': return 'Рассмотрено';
      default: return status;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Истекло';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `Осталось ${hours}ч ${minutes}м`;
    }
    return `Осталось ${minutes}м`;
  };

  const handleStartInterview = (invitationId: string) => {
    navigate(`/candidate/interview/${invitationId}`);
  };

  const handleViewReport = (invitationId: string) => {
    // Пока показываем модалку с информацией
    Modal.info({
      title: 'Отчет по интервью',
      content: 'Отчет будет доступен после реализации AI-анализа',
      okText: 'Понятно'
    });
  };

  const handleUploadCV = async (file: File) => {
    try {
      await authAPI.uploadCV(file);
      message.success('Резюме успешно загружено');
      setUploadModalVisible(false);
    } catch (error) {
      message.error('Ошибка загрузки резюме');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: logout,
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Recruit.ai
          </Title>
        </div>
        <Space>
          <NotificationCenter userId={user?.id.toString() || ''} />
          <Button 
            icon={<UploadOutlined />} 
            onClick={() => setUploadModalVisible(true)}
          >
            Загрузить резюме
          </Button>
          <Dropdown 
            menu={{ items: userMenuItems }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.first_name} {user?.last_name}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>

      <div className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <Title level={2}>Добро пожаловать, {user?.first_name}!</Title>
          <Paragraph type="secondary">
            Здесь вы можете видеть приглашения на интервью и проходить AI-собеседования.
          </Paragraph>
        </div>

        <Card>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'invitations',
                label: 'Приглашения',
                children: (
                  <div>
                    {loading ? (
                      <Card loading />
                    ) : invitations.length === 0 ? (
                      <Card>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <FileTextOutlined style={{ fontSize: '3rem', color: '#d9d9d9', marginBottom: '1rem' }} />
                          <Title level={4} type="secondary">Пока нет приглашений</Title>
                          <Paragraph type="secondary">
                            Приглашения на интервью будут появляться здесь, когда компании заинтересуются вашим профилем.
                          </Paragraph>
                        </div>
                      </Card>
                    ) : (
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {invitations.map((invitation) => (
                          <Card
                            key={invitation.id}
                            className="interview-card"
                            actions={[
                              invitation.status === 'sent' && (
                                <Button
                                  key="start"
                                  type="primary"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => handleStartInterview(invitation.id)}
                                >
                                  Начать интервью
                                </Button>
                              ),
                              invitation.status === 'reviewed' && (
                                <Button
                                  key="report"
                                  icon={<FileTextOutlined />}
                                  onClick={() => handleViewReport(invitation.id)}
                                >
                                  Посмотреть отчет
                                </Button>
                              ),
                            ].filter(Boolean)}
                          >
                            <div className="interview-header">
                              <div>
                                <Title level={4} style={{ margin: 0 }}>
                                  {invitation.company_name}
                                </Title>
                                <Text strong style={{ fontSize: '16px' }}>
                                  {invitation.job_title}
                                </Text>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <Tag 
                                  color={getStatusColor(invitation.status)}
                                  style={{ marginBottom: '0.5rem' }}
                                >
                                  {getStatusText(invitation.status)}
                                </Tag>
                                {invitation.status === 'sent' && (
                                  <div className="deadline">
                                    <ClockCircleOutlined /> {getTimeRemaining(invitation.expires_at)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {invitation.job_description && (
                              <Paragraph type="secondary" style={{ marginTop: '1rem' }}>
                                {invitation.job_description}
                              </Paragraph>
                            )}

                            <div style={{ marginTop: '1rem', fontSize: '14px', color: '#999' }}>
                              Приглашение получено: {new Date(invitation.invited_at).toLocaleDateString('ru-RU')}
                            </div>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </div>
                )
              },
              {
                key: 'history',
                label: 'История интервью',
                children: <InterviewHistory userId={user?.id.toString() || ''} />
              }
            ]}
          />
        </Card>
      </div>

      {/* Модалка загрузки резюме */}
      <Modal
        title="Загрузка резюме"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          name="file"
          multiple={false}
          accept=".pdf,.docx,.doc"
          beforeUpload={(file) => {
            handleUploadCV(file);
            return false; // Предотвращаем автоматическую загрузку
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Нажмите или перетащите файл для загрузки</p>
          <p className="ant-upload-hint">
            Поддерживаются форматы: PDF, DOCX, DOC. Максимальный размер: 10MB
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default Dashboard;
