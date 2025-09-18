import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, Typography, Button, Modal, Space, Tag, Tooltip } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

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

const InterviewCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [invitations, setInvitations] = useState<InterviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedInvitations, setSelectedInvitations] = useState<InterviewInvitation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  const getInvitationsForDate = (date: Dayjs): InterviewInvitation[] => {
    return invitations.filter(invitation => {
      if (!invitation.scheduled_at) return false;
      const scheduledDate = dayjs(invitation.scheduled_at);
      return scheduledDate.isSame(date, 'day');
    });
  };

  const getDateCellRender = (date: Dayjs) => {
    const dayInvitations = getInvitationsForDate(date);
    
    if (dayInvitations.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {dayInvitations.map(invitation => {
          const isNow = dayjs().isSame(dayjs(invitation.scheduled_at), 'day') && 
                       dayjs().isAfter(dayjs(invitation.scheduled_at).subtract(30, 'minute')) &&
                       dayjs().isBefore(dayjs(invitation.scheduled_at).add(2, 'hour'));
          
          const canStart = invitation.status === 'accepted' && isNow;
          
          return (
            <Tooltip
              key={invitation.id}
              title={`${invitation.job_title} - ${invitation.company_name} в ${dayjs(invitation.scheduled_at).format('HH:mm')}`}
            >
              <Badge
                count={canStart ? 1 : 0}
                style={{ backgroundColor: canStart ? '#52c41a' : '#1890ff' }}
              >
                <Tag
                  color={canStart ? 'success' : 'blue'}
                  style={{ 
                    margin: 0, 
                    fontSize: '10px', 
                    padding: '1px 4px',
                    cursor: canStart ? 'pointer' : 'default'
                  }}
                  onClick={canStart ? () => handleStartInterview(invitation) : undefined}
                >
                  {dayjs(invitation.scheduled_at).format('HH:mm')}
                </Tag>
              </Badge>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const handleDateSelect = (date: Dayjs) => {
    const dayInvitations = getInvitationsForDate(date);
    setSelectedDate(date);
    setSelectedInvitations(dayInvitations);
    setModalVisible(dayInvitations.length > 0);
  };

  const handleStartInterview = (invitation: InterviewInvitation) => {
    // Переходим на страницу интервью
    navigate(`/candidate/interview/${invitation.id}`);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD.MM.YYYY HH:mm');
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

  return (
    <div className="interview-calendar-container">
      <Card className="section-content">
        <div style={{ marginBottom: 16 }}>
          <Title level={3} className="section-title">
            <CalendarOutlined /> Календарь интервью
          </Title>
          <Text type="secondary">
            Отмеченные даты показывают запланированные интервью. Зеленые метки означают, что интервью можно начать.
          </Text>
        </div>

        <Calendar
          dateCellRender={getDateCellRender}
          onSelect={handleDateSelect}
          loading={loading}
          style={{ background: 'transparent' }}
        />

        <Modal
          title={`Интервью на ${selectedDate?.format('DD.MM.YYYY')}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={600}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {selectedInvitations.map(invitation => {
              const isNow = dayjs().isSame(dayjs(invitation.scheduled_at), 'day') && 
                           dayjs().isAfter(dayjs(invitation.scheduled_at).subtract(30, 'minute')) &&
                           dayjs().isBefore(dayjs(invitation.scheduled_at).add(2, 'hour'));
              
              const canStart = invitation.status === 'accepted' && isNow;
              
              return (
                <Card key={invitation.id} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                        {invitation.job_title}
                      </Title>
                      <Text type="secondary">
                        {invitation.company_name} • {formatDate(invitation.scheduled_at!)}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={getStatusColor(invitation.status)}>
                          {getStatusText(invitation.status)}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      {canStart ? (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleStartInterview(invitation)}
                        >
                          Начать интервью
                        </Button>
                      ) : (
                        <Button disabled>
                          {invitation.status === 'accepted' ? 'Ожидайте времени' : 'Недоступно'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        </Modal>
      </Card>
    </div>
  );
};

export default InterviewCalendar;
