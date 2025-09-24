import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Avatar,
  Tag,
  Space,
  Row,
  Col,
  Table,
  Progress,
  Modal,
  Descriptions,
  Divider,
  Alert,
  Spin,
  Empty,
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
  ClockCircleOutlined,
  FileTextOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

const { Title, Text, Paragraph } = Typography;

interface CandidateInProcess {
  id: number;
  candidate_id: number;
  job_id: number;
  job_title: string;
  status: string;
  applied_at: string;
  reviewed_at?: string;
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  overall_score?: number;
  technical_score?: number;
  communication_score?: number;
  experience_score?: number;
  candidate: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    candidate_profile?: {
      experience_years?: number;
      current_position?: string;
      skills?: string;
      education?: string;
      location?: string;
    };
  };
  interview_report?: {
    id: number;
    status: string;
    overall_score?: number;
    technical_score?: number;
    communication_score?: number;
    experience_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    detailed_analysis?: string;
    interview_duration?: number;
    questions_answered?: number;
    ai_notes?: string;
  };
}

const CandidatesInProcess: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [candidates, setCandidates] = useState<CandidateInProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateInProcess | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      // Здесь будет API вызов для получения кандидатов в процессе отбора
      // Пока используем моковые данные
      const mockCandidates: CandidateInProcess[] = [
        {
          id: 1,
          candidate_id: 1,
          job_id: 1,
          job_title: "Frontend Developer",
          status: "interview_completed",
          applied_at: "2024-01-15T10:00:00Z",
          reviewed_at: "2024-01-16T14:30:00Z",
          interview_scheduled_at: "2024-01-20T15:00:00Z",
          interview_completed_at: "2024-01-20T16:30:00Z",
          overall_score: 85,
          technical_score: 90,
          communication_score: 80,
          experience_score: 85,
          candidate: {
            id: 1,
            first_name: "Иван",
            last_name: "Петров",
            email: "ivan.petrov@example.com",
            phone: "+996 555 123 456",
            candidate_profile: {
              experience_years: 3,
              current_position: "Frontend Developer",
              skills: "React, TypeScript, JavaScript, HTML, CSS",
              education: "Высшее техническое",
              location: "Бишкек"
            }
          },
          interview_report: {
            id: 1,
            status: "completed",
            overall_score: 85,
            technical_score: 90,
            communication_score: 80,
            experience_score: 85,
            strengths: ["Отличные навыки React", "Хорошее понимание TypeScript", "Опыт работы в команде"],
            weaknesses: ["Ограниченный опыт с тестированием", "Нужно улучшить навыки работы с API"],
            recommendations: ["Рекомендуется к найму", "Начать с junior позиции", "Предоставить менторство"],
            detailed_analysis: "Кандидат показал хорошие технические навыки и понимание современных технологий...",
            interview_duration: 90,
            questions_answered: 8,
            ai_notes: "Кандидат демонстрирует потенциал для роста и готовность к обучению."
          }
        }
      ];
      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Ошибка загрузки кандидатов:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить список кандидатов'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (candidate: CandidateInProcess) => {
    setSelectedCandidate(candidate);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'blue';
      case 'reviewed': return 'orange';
      case 'interview_scheduled': return 'purple';
      case 'interview_completed': return 'green';
      case 'hired': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied': return 'Подал заявку';
      case 'reviewed': return 'Рассмотрен';
      case 'interview_scheduled': return 'Интервью назначено';
      case 'interview_completed': return 'Интервью пройдено';
      case 'hired': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#faad14';
    if (score >= 70) return '#fa8c16';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Кандидат',
      key: 'candidate',
      render: (record: CandidateInProcess) => (
        <Space>
          <Avatar 
            size={40} 
            src={record.candidate.avatar_url} 
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.candidate.first_name} {record.candidate.last_name}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.candidate.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Вакансия',
      dataIndex: 'job_title',
      key: 'job_title',
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: CandidateInProcess) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Оценка',
      key: 'score',
      render: (record: CandidateInProcess) => (
        record.overall_score ? (
          <div>
            <Progress 
              type="circle" 
              size={40} 
              percent={record.overall_score}
              strokeColor={getScoreColor(record.overall_score)}
            />
            <div style={{ fontSize: '12px', textAlign: 'center', marginTop: 4 }}>
              {record.overall_score}/100
            </div>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Дата подачи',
      key: 'applied_at',
      render: (record: CandidateInProcess) => (
        new Date(record.applied_at).toLocaleDateString('ru-RU')
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: CandidateInProcess) => (
        <Space>
          <Tooltip title="Посмотреть детали">
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetails(record)}
            >
              Детали
            </Button>
          </Tooltip>
        </Space>
      ),
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
      </div>

      <div className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <Space style={{ marginBottom: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/recruiter/dashboard')}
            >
              Назад к дашборду
            </Button>
          </Space>
          <Title level={2}>Кандидаты в процессе отбора</Title>
          <Text type="secondary">
            Просмотр кандидатов, которые проходят отбор и их результатов
          </Text>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : candidates.length === 0 ? (
            <Empty
              description="Кандидаты в процессе отбора не найдены"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={candidates}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} из ${total} кандидатов`,
              }}
            />
          )}
        </Card>
      </div>

      {/* Модальное окно с детальной информацией */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={48} 
              src={selectedCandidate?.candidate.avatar_url} 
              icon={<UserOutlined />} 
            />
            <div style={{ marginLeft: 12 }}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedCandidate?.candidate.first_name} {selectedCandidate?.candidate.last_name}
              </Title>
              <Text type="secondary">{selectedCandidate?.job_title}</Text>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedCandidate && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={5}>Информация о кандидате</Title>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Email">
                    <MailOutlined /> {selectedCandidate.candidate.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Телефон">
                    <PhoneOutlined /> {selectedCandidate.candidate.phone || 'Не указан'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Опыт работы">
                    <TrophyOutlined /> {selectedCandidate.candidate.candidate_profile?.experience_years || 0} лет
                  </Descriptions.Item>
                  <Descriptions.Item label="Текущая позиция">
                    <UserOutlined /> {selectedCandidate.candidate.candidate_profile?.current_position || 'Не указана'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Образование">
                    <FileTextOutlined /> {selectedCandidate.candidate.candidate_profile?.education || 'Не указано'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Локация">
                    <EnvironmentOutlined /> {selectedCandidate.candidate.candidate_profile?.location || 'Не указана'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col span={24}>
                <Title level={5}>Навыки</Title>
                <Text>{selectedCandidate.candidate.candidate_profile?.skills || 'Не указаны'}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>Статус отбора</Title>
                <Space>
                  <Tag color={getStatusColor(selectedCandidate.status)}>
                    {getStatusText(selectedCandidate.status)}
                  </Tag>
                  <Text type="secondary">
                    <CalendarOutlined /> Подал заявку: {new Date(selectedCandidate.applied_at).toLocaleDateString('ru-RU')}
                  </Text>
                </Space>
              </Col>

              {selectedCandidate.interview_report && (
                <Col span={24}>
                  <Divider />
                  <Title level={5}>Результаты интервью</Title>
                  
                  <Row gutter={[16, 16]}>
                    <Col span={6}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Progress 
                            type="circle" 
                            size={60} 
                            percent={selectedCandidate.interview_report.overall_score}
                            strokeColor={getScoreColor(selectedCandidate.interview_report.overall_score || 0)}
                          />
                          <div style={{ marginTop: 8, fontWeight: 'bold' }}>Общая оценка</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Progress 
                            type="circle" 
                            size={60} 
                            percent={selectedCandidate.interview_report.technical_score}
                            strokeColor={getScoreColor(selectedCandidate.interview_report.technical_score || 0)}
                          />
                          <div style={{ marginTop: 8, fontWeight: 'bold' }}>Техническая</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Progress 
                            type="circle" 
                            size={60} 
                            percent={selectedCandidate.interview_report.communication_score}
                            strokeColor={getScoreColor(selectedCandidate.interview_report.communication_score || 0)}
                          />
                          <div style={{ marginTop: 8, fontWeight: 'bold' }}>Коммуникация</div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Progress 
                            type="circle" 
                            size={60} 
                            percent={selectedCandidate.interview_report.experience_score}
                            strokeColor={getScoreColor(selectedCandidate.interview_report.experience_score || 0)}
                          />
                          <div style={{ marginTop: 8, fontWeight: 'bold' }}>Опыт</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Title level={5}>Сильные стороны</Title>
                      <ul>
                        {selectedCandidate.interview_report.strengths?.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </Col>
                    <Col span={12}>
                      <Title level={5}>Области для улучшения</Title>
                      <ul>
                        {selectedCandidate.interview_report.weaknesses?.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </Col>
                  </Row>

                  <Col span={24}>
                    <Title level={5}>Рекомендации</Title>
                    <ul>
                      {selectedCandidate.interview_report.recommendations?.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  </Col>

                  <Col span={24}>
                    <Title level={5}>Детальный анализ</Title>
                    <Text>{selectedCandidate.interview_report.detailed_analysis}</Text>
                  </Col>

                  <Col span={24}>
                    <Title level={5}>AI заметки</Title>
                    <Text>{selectedCandidate.interview_report.ai_notes}</Text>
                  </Col>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CandidatesInProcess;
