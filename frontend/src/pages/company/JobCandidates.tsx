import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Typography,
  Avatar,
  Tag,
  Space,
  Row,
  Col,
  Descriptions,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  message,
  Spin,
  Alert,
  Divider,
  Tooltip
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CandidateApplication {
  id: number;
  candidate_id: number;
  job_id: number;
  job_title: string;
  status: string;
  applied_at: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  decision_at?: string;
  cover_letter?: string;
  expected_salary?: number;
  availability_date?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_avatar?: string;
  candidate_experience_years?: number;
  candidate_current_position?: string;
  candidate_skills?: string;
}

const JobCandidates: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (jobId) {
      loadCandidates();
    }
  }, [jobId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getJobApplications(jobId!);
      setCandidates(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки кандидатов:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить список кандидатов'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'blue';
      case 'reviewed': return 'orange';
      case 'interview_scheduled': return 'purple';
      case 'interview_completed': return 'green';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied': return 'Подал заявку';
      case 'reviewed': return 'Рассмотрен';
      case 'interview_scheduled': return 'Интервью назначено';
      case 'interview_completed': return 'Интервью пройдено';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  const handleViewCandidate = (candidate: CandidateApplication) => {
    setSelectedCandidate(candidate);
    setViewModalVisible(true);
  };

  const handleScheduleInterview = (candidate: CandidateApplication) => {
    setSelectedCandidate(candidate);
    setInterviewModalVisible(true);
  };

  const handleRejectCandidate = async (candidateId: number) => {
    try {
      setActionLoading(true);
      await authAPI.updateApplicationStatus(candidateId.toString(), 'rejected');
      
      showSuccess({
        title: 'Кандидат отклонен',
        message: 'Кандидат был отклонен'
      });
      
      loadCandidates();
    } catch (error: any) {
      console.error('Ошибка отклонения кандидата:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось отклонить кандидата'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptCandidate = async (candidateId: number) => {
    try {
      setActionLoading(true);
      await authAPI.updateApplicationStatus(candidateId.toString(), 'accepted');
      
      showSuccess({
        title: 'Кандидат принят',
        message: 'Кандидат был принят на работу'
      });
      
      loadCandidates();
    } catch (error: any) {
      console.error('Ошибка принятия кандидата:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось принять кандидата'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInterviewSubmit = async (values: any) => {
    if (!selectedCandidate) return;

    try {
      setActionLoading(true);
      
      // Обновляем статус на "interview_scheduled"
      await authAPI.updateApplicationStatus(selectedCandidate.id.toString(), 'interview_scheduled');
      
      // Создаем приглашение на интервью
      const interviewDateTime = new Date(values.interview_date);
      if (values.interview_time) {
        const [hours, minutes] = values.interview_time.format('HH:mm').split(':');
        interviewDateTime.setHours(parseInt(hours), parseInt(minutes));
      }
      
      // Устанавливаем срок действия приглашения (через 7 дней)
      const expiresAt = new Date(interviewDateTime);
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await authAPI.createInterviewInvitation({
        job_id: selectedCandidate.job_id,
        candidate_id: selectedCandidate.candidate_id,
        application_id: selectedCandidate.id,
        expires_at: expiresAt.toISOString(),
        scheduled_at: interviewDateTime.toISOString(),
        interview_language: 'ru',
        custom_questions: values.notes ? [values.notes] : undefined
      });
      
      showSuccess({
        title: 'Интервью назначено',
        message: 'Интервью успешно назначено кандидату. Приглашение отправлено.'
      });
      
      setInterviewModalVisible(false);
      form.resetFields();
      loadCandidates();
    } catch (error: any) {
      console.error('Ошибка назначения интервью:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось назначить интервью'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Не указано';
    return `${salary.toLocaleString()} ₽`;
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загружаем кандидатов...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="job-candidates-container">
      <div className="job-candidates-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/company/dashboard')}
          className="ant-btn"
        >
          Назад к дашборду
        </Button>
        
        <div className="job-candidates-title">
          <Title level={2} className="section-title">
            Кандидаты по вакансии
          </Title>
          <Text type="secondary">
            Найдено кандидатов: {candidates.length}
          </Text>
        </div>
      </div>

      <div className="job-candidates-content">
        {candidates.length === 0 ? (
          <Card>
            <Alert
              message="Кандидаты не найдены"
              description="На эту вакансию пока никто не откликнулся"
              type="info"
              showIcon
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {candidates.map((candidate) => (
              <Col xs={24} lg={12} xl={8} key={candidate.id}>
                <Card
                  className="section-content"
                  actions={[
                    <Tooltip title="Подробнее о кандидате">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewCandidate(candidate)}
                      >
                        Подробнее
                      </Button>
                    </Tooltip>,
                    candidate.status === 'applied' || candidate.status === 'reviewed' ? (
                      <Tooltip title="Назначить интервью">
                        <Button
                          type="primary"
                          icon={<CalendarOutlined />}
                          onClick={() => handleScheduleInterview(candidate)}
                        >
                          Интервью
                        </Button>
                      </Tooltip>
                    ) : null,
                    candidate.status === 'interview_completed' ? (
                      <Tooltip title="Принять кандидата">
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleAcceptCandidate(candidate.id)}
                          loading={actionLoading}
                        >
                          Принять
                        </Button>
                      </Tooltip>
                    ) : null,
                    candidate.status !== 'rejected' && candidate.status !== 'accepted' ? (
                      <Tooltip title="Отклонить кандидата">
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleRejectCandidate(candidate.id)}
                          loading={actionLoading}
                        >
                          Отклонить
                        </Button>
                      </Tooltip>
                    ) : null
                  ].filter(Boolean)}
                >
                  <div className="candidate-card-header">
                    <Avatar
                      size={64}
                      src={candidate.candidate_avatar}
                      icon={<UserOutlined />}
                      className="candidate-avatar"
                    />
                    <div className="candidate-info">
                      <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                        {candidate.candidate_name}
                      </Title>
                      <Text type="secondary">
                        {candidate.candidate_current_position || 'Позиция не указана'}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={getStatusColor(candidate.status)}>
                          {getStatusText(candidate.status)}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="candidate-details">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div className="candidate-detail-item">
                        <MailOutlined className="detail-icon" />
                        <Text>{candidate.candidate_email}</Text>
                      </div>
                      {candidate.candidate_phone && (
                        <div className="candidate-detail-item">
                          <PhoneOutlined className="detail-icon" />
                          <Text>{candidate.candidate_phone}</Text>
                        </div>
                      )}
                      {candidate.candidate_experience_years && (
                        <div className="candidate-detail-item">
                          <StarOutlined className="detail-icon" />
                          <Text>Опыт: {candidate.candidate_experience_years} лет</Text>
                        </div>
                      )}
                      {candidate.expected_salary && (
                        <div className="candidate-detail-item">
                          <Text strong>Желаемая зарплата: {formatSalary(candidate.expected_salary)}</Text>
                        </div>
                      )}
                      <div className="candidate-detail-item">
                        <Text type="secondary">
                          Подал заявку: {formatDate(candidate.applied_at)}
                        </Text>
                      </div>
                    </Space>
                  </div>

                  {candidate.cover_letter && (
                    <div className="candidate-cover-letter">
                      <Text strong>Сопроводительное письмо:</Text>
                      <Paragraph
                        ellipsis={{ rows: 2, expandable: true }}
                        style={{ marginTop: 8, marginBottom: 0 }}
                      >
                        {candidate.cover_letter}
                      </Paragraph>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Модальное окно просмотра кандидата */}
      <Modal
        title={`Кандидат: ${selectedCandidate?.candidate_name}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCandidate && (
          <div className="candidate-detail-modal">
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <div className="candidate-avatar-section">
                  <Avatar
                    size={120}
                    src={selectedCandidate.candidate_avatar}
                    icon={<UserOutlined />}
                    className="candidate-avatar-large"
                  />
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Tag color={getStatusColor(selectedCandidate.status)} size="large">
                      {getStatusText(selectedCandidate.status)}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={16}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Имя">
                    {selectedCandidate.candidate_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {selectedCandidate.candidate_email}
                  </Descriptions.Item>
                  {selectedCandidate.candidate_phone && (
                    <Descriptions.Item label="Телефон">
                      {selectedCandidate.candidate_phone}
                    </Descriptions.Item>
                  )}
                  {selectedCandidate.candidate_current_position && (
                    <Descriptions.Item label="Текущая позиция">
                      {selectedCandidate.candidate_current_position}
                    </Descriptions.Item>
                  )}
                  {selectedCandidate.candidate_experience_years && (
                    <Descriptions.Item label="Опыт работы">
                      {selectedCandidate.candidate_experience_years} лет
                    </Descriptions.Item>
                  )}
                  {selectedCandidate.expected_salary && (
                    <Descriptions.Item label="Желаемая зарплата">
                      {formatSalary(selectedCandidate.expected_salary)}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Дата подачи заявки">
                    {formatDate(selectedCandidate.applied_at)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {selectedCandidate.candidate_skills && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Навыки</Title>
                <div className="skills-container">
                  {selectedCandidate.candidate_skills.split(',').map((skill, index) => (
                    <Tag key={index} className="ant-tag">
                      {skill.trim()}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {selectedCandidate.cover_letter && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Сопроводительное письмо</Title>
                <Paragraph>{selectedCandidate.cover_letter}</Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно назначения интервью */}
      <Modal
        title={`Назначить интервью: ${selectedCandidate?.candidate_name}`}
        open={interviewModalVisible}
        onCancel={() => {
          setInterviewModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInterviewSubmit}
        >
          <Form.Item
            name="interview_date"
            label="Дата интервью"
            rules={[{ required: true, message: 'Выберите дату интервью' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="interview_time"
            label="Время интервью"
            rules={[{ required: true, message: 'Выберите время интервью' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Дополнительные заметки"
          >
            <TextArea
              rows={4}
              placeholder="Дополнительная информация для кандидата..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading}
              >
                Назначить интервью
              </Button>
              <Button onClick={() => {
                setInterviewModalVisible(false);
                form.resetFields();
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JobCandidates;
