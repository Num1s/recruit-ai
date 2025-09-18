import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Tag, Space, Avatar, Dropdown, Menu, Upload, message, Modal, Tabs } from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined, 
  UploadOutlined, 
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  BuildOutlined,
  SearchOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { authAPI } from '../../services/api.ts';
import NotificationCenter from '../../components/candidate/NotificationCenter.tsx';
import InterviewHistory from '../../components/candidate/InterviewHistory.tsx';

const { Title, Text, Paragraph } = Typography;

interface InterviewInvitation {
  id: number;
  job_id: number;
  candidate_id: number;
  application_id?: number;
  status: string;
  invited_at: string;
  expires_at: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  interview_language: string;
  custom_questions?: string[];
  job_title?: string;
  company_name?: string;
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
      setLoading(true);
      const response = await authAPI.getCandidateInvitations();
      setInvitations(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки приглашений:', error);
      // В случае ошибки показываем пустой массив
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'blue';
      case 'accepted': return 'green';
      case 'declined': return 'red';
      case 'expired': return 'default';
      case 'completed': return 'success';
      case 'reviewed': return 'purple';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Ожидает ответа';
      case 'accepted': return 'Принято';
      case 'declined': return 'Отклонено';
      case 'expired': return 'Истекло';
      case 'completed': return 'Завершено';
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

  const isInvitationValid = (invitation: InterviewInvitation) => {
    const now = new Date();
    const expiry = new Date(invitation.expires_at);
    return expiry.getTime() > now.getTime() && invitation.status === 'accepted';
  };

  const canStartInterview = (invitation: InterviewInvitation) => {
    if (!isInvitationValid(invitation)) return false;
    
    // Если есть запланированное время, проверяем, можно ли начать
    if (invitation.scheduled_at) {
      const now = new Date();
      const scheduledTime = new Date(invitation.scheduled_at);
      const timeDiff = now.getTime() - scheduledTime.getTime();
      
      // Можно начать за 30 минут до назначенного времени и в течение 2 часов после
      return timeDiff >= -30 * 60 * 1000 && timeDiff <= 2 * 60 * 60 * 1000;
    }
    
    // Если нет запланированного времени, можно начать в любое время
    return true;
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await authAPI.updateInvitationStatus(invitationId.toString(), 'accepted');
      message.success('Приглашение принято!');
      loadInvitations(); // Перезагружаем список
    } catch (error: any) {
      console.error('Ошибка принятия приглашения:', error);
      message.error('Не удалось принять приглашение');
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      await authAPI.updateInvitationStatus(invitationId.toString(), 'declined');
      message.success('Приглашение отклонено');
      loadInvitations(); // Перезагружаем список
    } catch (error: any) {
      console.error('Ошибка отклонения приглашения:', error);
      message.error('Не удалось отклонить приглашение');
    }
  };

  const handleStartInterview = (invitationId: number) => {
    navigate(`/candidate/interview/${invitationId}`);
  };

  const handleViewReport = (invitationId: number) => {
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

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        navigate('/candidate/profile');
        break;
      case 'settings':
        navigate('/candidate/settings');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
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
            icon={<BuildOutlined />} 
            onClick={() => navigate('/candidate/companies')}
          >
            Найти компании
          </Button>
          <Button 
            icon={<SearchOutlined />} 
            onClick={() => navigate('/candidate/jobs')}
          >
            Вакансии
          </Button>
          <Button 
            icon={<ClockCircleOutlined />} 
            onClick={() => navigate('/candidate/invitations')}
          >
            Приглашения
          </Button>
          <Button 
            icon={<CalendarOutlined />} 
            onClick={() => navigate('/candidate/calendar')}
          >
            Календарь
          </Button>
          <Button 
            icon={<UploadOutlined />} 
            onClick={() => setUploadModalVisible(true)}
          >
            Загрузить резюме
          </Button>
          <Dropdown 
            menu={{ 
              items: userMenuItems,
              onClick: ({ key }) => handleMenuClick(key)
            }}
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
                                  key="accept"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleAcceptInvitation(invitation.id)}
                                >
                                  Принять
                                </Button>
                              ),
                              invitation.status === 'sent' && (
                                <Button
                                  key="decline"
                                  danger
                                  icon={<CloseCircleOutlined />}
                                  onClick={() => handleDeclineInvitation(invitation.id)}
                                >
                                  Отклонить
                                </Button>
                              ),
                              canStartInterview(invitation) && (
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

                            {invitation.scheduled_at && (
                              <div style={{ marginTop: '1rem', fontSize: '14px', color: '#52c41a' }}>
                                <CalendarOutlined /> Планируемое время: {new Date(invitation.scheduled_at).toLocaleString('ru-RU')}
                              </div>
                            )}

                            {canStartInterview(invitation) && (
                              <div style={{ marginTop: '1rem', fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                                <PlayCircleOutlined /> Интервью доступно для начала
                              </div>
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
