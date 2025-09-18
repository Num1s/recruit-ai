import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Descriptions,
  Modal,
  message,
  Spin,
  Alert,
  Divider,
  Tooltip,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

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

const InterviewInvitations: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [invitations, setInvitations] = useState<InterviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить приглашения на интервью'
      });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <ClockCircleOutlined />;
      case 'accepted': return <CheckCircleOutlined />;
      case 'declined': return <CloseCircleOutlined />;
      case 'expired': return <ExclamationCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'reviewed': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      setActionLoading(true);
      await authAPI.updateInvitationStatus(invitationId.toString(), 'accepted');
      
      showSuccess({
        title: 'Приглашение принято',
        message: 'Вы приняли приглашение на интервью'
      });
      
      loadInvitations();
    } catch (error: any) {
      console.error('Ошибка принятия приглашения:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось принять приглашение'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      setActionLoading(true);
      await authAPI.updateInvitationStatus(invitationId.toString(), 'declined');
      
      showSuccess({
        title: 'Приглашение отклонено',
        message: 'Вы отклонили приглашение на интервью'
      });
      
      loadInvitations();
    } catch (error: any) {
      console.error('Ошибка отклонения приглашения:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось отклонить приглашение'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const canRespond = (invitation: InterviewInvitation) => {
    return invitation.status === 'sent' && !isExpired(invitation.expires_at);
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загружаем приглашения...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-invitations-container">
      <div className="interview-invitations-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/candidate/dashboard')}
          className="ant-btn"
        >
          Назад к дашборду
        </Button>
        
        <div className="interview-invitations-title">
          <Title level={2} className="section-title">
            Приглашения на интервью
          </Title>
          <Text type="secondary">
            Найдено приглашений: {invitations.length}
          </Text>
        </div>
      </div>

      <div className="interview-invitations-content">
        {invitations.length === 0 ? (
          <Card>
            <Alert
              message="Приглашения не найдены"
              description="У вас пока нет приглашений на интервью"
              type="info"
              showIcon
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {invitations.map((invitation) => (
              <Col xs={24} lg={12} xl={8} key={invitation.id}>
                <Card
                  className="section-content"
                  title={
                    <div className="invitation-card-header">
                      <div>
                        <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                          {invitation.job_title || 'Вакансия'}
                        </Title>
                        <Text type="secondary">
                          <BankOutlined /> {invitation.company_name || 'Компания'}
                        </Text>
                      </div>
                      <Badge 
                        count={canRespond(invitation) ? 1 : 0}
                        style={{ backgroundColor: '#52c41a' }}
                      >
                        <Tag 
                          color={getStatusColor(invitation.status)}
                          icon={getStatusIcon(invitation.status)}
                        >
                          {getStatusText(invitation.status)}
                        </Tag>
                      </Badge>
                    </div>
                  }
                  actions={
                    canRespond(invitation) ? [
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        loading={actionLoading}
                      >
                        Принять
                      </Button>,
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        loading={actionLoading}
                      >
                        Отклонить
                      </Button>
                    ] : []
                  }
                >
                  <div className="invitation-details">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div className="invitation-detail-item">
                        <CalendarOutlined className="detail-icon" />
                        <Text strong>Приглашение отправлено:</Text>
                        <Text>{formatDate(invitation.invited_at)}</Text>
                      </div>
                      
                      <div className="invitation-detail-item">
                        <ClockCircleOutlined className="detail-icon" />
                        <Text strong>Действительно до:</Text>
                        <Text type={isExpired(invitation.expires_at) ? 'danger' : 'secondary'}>
                          {formatDate(invitation.expires_at)}
                        </Text>
                      </div>

                      {invitation.scheduled_at && (
                        <div className="invitation-detail-item">
                          <CalendarOutlined className="detail-icon" />
                          <Text strong>Планируемое время интервью:</Text>
                          <Text type="success">{formatDate(invitation.scheduled_at)}</Text>
                        </div>
                      )}

                      <div className="invitation-detail-item">
                        <UserOutlined className="detail-icon" />
                        <Text strong>Язык интервью:</Text>
                        <Text>{invitation.interview_language === 'ru' ? 'Русский' : 'English'}</Text>
                      </div>

                      {invitation.started_at && (
                        <div className="invitation-detail-item">
                          <CheckCircleOutlined className="detail-icon" />
                          <Text strong>Начато:</Text>
                          <Text>{formatDate(invitation.started_at)}</Text>
                        </div>
                      )}

                      {invitation.completed_at && (
                        <div className="invitation-detail-item">
                          <CheckCircleOutlined className="detail-icon" />
                          <Text strong>Завершено:</Text>
                          <Text>{formatDate(invitation.completed_at)}</Text>
                        </div>
                      )}
                    </Space>
                  </div>

                  {invitation.custom_questions && invitation.custom_questions.length > 0 && (
                    <div className="invitation-questions">
                      <Divider />
                      <Text strong>Дополнительные вопросы от компании:</Text>
                      <div style={{ marginTop: 8 }}>
                        {invitation.custom_questions.map((question, index) => (
                          <div key={index} style={{ marginBottom: 8 }}>
                            <Text>{question}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {canRespond(invitation) && (
                    <div className="invitation-actions" style={{ marginTop: 16, textAlign: 'center' }}>
                      <Text type="secondary">
                        У вас есть время до {formatDate(invitation.expires_at)} чтобы ответить на приглашение
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default InterviewInvitations;

