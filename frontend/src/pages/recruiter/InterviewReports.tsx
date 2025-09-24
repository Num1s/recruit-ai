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
  Tooltip,
  List,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DownloadOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useNotification } from '../../contexts/NotificationContext.tsx';

const { Title, Text, Paragraph } = Typography;

interface InterviewReport {
  id: number;
  invitation_id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  created_at: string;
  completed_at?: string;
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
  candidate_name?: string;
  job_title?: string;
  company_name?: string;
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
}

const InterviewReports: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<InterviewReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    averageScore: 0,
    completedInterviews: 0,
    pendingInterviews: 0
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Здесь будет API вызов для получения отчетов по интервью
      // Пока используем моковые данные
      const mockReports: InterviewReport[] = [
        {
          id: 1,
          invitation_id: 1,
          candidate_id: 1,
          job_id: 1,
          status: "completed",
          created_at: "2024-01-20T15:00:00Z",
          completed_at: "2024-01-20T16:30:00Z",
          overall_score: 85,
          technical_score: 90,
          communication_score: 80,
          experience_score: 85,
          strengths: ["Отличные навыки React", "Хорошее понимание TypeScript", "Опыт работы в команде"],
          weaknesses: ["Ограниченный опыт с тестированием", "Нужно улучшить навыки работы с API"],
          recommendations: ["Рекомендуется к найму", "Начать с junior позиции", "Предоставить менторство"],
          detailed_analysis: "Кандидат показал хорошие технические навыки и понимание современных технологий. Демонстрирует потенциал для роста и готовность к обучению.",
          interview_duration: 90,
          questions_answered: 8,
          ai_notes: "Кандидат демонстрирует потенциал для роста и готовность к обучению.",
          candidate_name: "Иван Петров",
          job_title: "Frontend Developer",
          company_name: "Tech Company",
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
          }
        },
        {
          id: 2,
          invitation_id: 2,
          candidate_id: 2,
          job_id: 2,
          status: "completed",
          created_at: "2024-01-22T10:00:00Z",
          completed_at: "2024-01-22T11:15:00Z",
          overall_score: 92,
          technical_score: 95,
          communication_score: 90,
          experience_score: 90,
          strengths: ["Превосходные технические навыки", "Отличная коммуникация", "Большой опыт"],
          weaknesses: ["Может быть слишком требовательным к зарплате"],
          recommendations: ["Сильно рекомендуется к найму", "Подходит для senior позиции"],
          detailed_analysis: "Очень сильный кандидат с отличными техническими навыками и опытом.",
          interview_duration: 75,
          questions_answered: 10,
          ai_notes: "Кандидат высокого уровня, готов к сложным задачам.",
          candidate_name: "Анна Смирнова",
          job_title: "Senior Backend Developer",
          company_name: "Tech Company",
          candidate: {
            id: 2,
            first_name: "Анна",
            last_name: "Смирнова",
            email: "anna.smirnova@example.com",
            phone: "+996 555 789 012",
            candidate_profile: {
              experience_years: 5,
              current_position: "Senior Backend Developer",
              skills: "Python, Django, PostgreSQL, Docker, AWS",
              education: "Высшее техническое",
              location: "Бишкек"
            }
          }
        }
      ];
      
      setReports(mockReports);
      
      // Вычисляем статистику
      const completedReports = mockReports.filter(r => r.status === 'completed');
      const totalScore = completedReports.reduce((sum, r) => sum + (r.overall_score || 0), 0);
      
      setStats({
        totalReports: mockReports.length,
        averageScore: completedReports.length > 0 ? Math.round(totalScore / completedReports.length) : 0,
        completedInterviews: completedReports.length,
        pendingInterviews: mockReports.length - completedReports.length
      });
    } catch (error) {
      console.error('Ошибка загрузки отчетов:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить отчеты по интервью'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: InterviewReport) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in_progress': return 'В процессе';
      case 'pending': return 'Ожидает';
      case 'cancelled': return 'Отменено';
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
      render: (record: InterviewReport) => (
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
      render: (record: InterviewReport) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Общая оценка',
      key: 'overall_score',
      render: (record: InterviewReport) => (
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
      title: 'Дата интервью',
      key: 'created_at',
      render: (record: InterviewReport) => (
        <div>
          <div>{new Date(record.created_at).toLocaleDateString('ru-RU')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <ClockCircleOutlined /> {record.interview_duration || 0} мин
          </div>
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: InterviewReport) => (
        <Space>
          <Tooltip title="Посмотреть отчет">
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewReport(record)}
            >
              Отчет
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
          <Title level={2}>Отчеты по интервью</Title>
          <Text type="secondary">
            Просмотр результатов интервью и аналитических отчетов
          </Text>
        </div>

        {/* Статистика */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Всего отчетов"
                value={stats.totalReports}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Средняя оценка"
                value={stats.averageScore}
                suffix="/100"
                prefix={<StarOutlined />}
                valueStyle={{ color: getScoreColor(stats.averageScore) }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Завершено"
                value={stats.completedInterviews}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Ожидает"
                value={stats.pendingInterviews}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : reports.length === 0 ? (
            <Empty
              description="Отчеты по интервью не найдены"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={reports}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} из ${total} отчетов`,
              }}
            />
          )}
        </Card>
      </div>

      {/* Модальное окно с детальным отчетом */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={48} 
              src={selectedReport?.candidate.avatar_url} 
              icon={<UserOutlined />} 
            />
            <div style={{ marginLeft: 12 }}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedReport?.candidate.first_name} {selectedReport?.candidate.last_name}
              </Title>
              <Text type="secondary">{selectedReport?.job_title}</Text>
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
        width={900}
      >
        {selectedReport && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={5}>Информация о кандидате</Title>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Email">
                    {selectedReport.candidate.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Телефон">
                    {selectedReport.candidate.phone || 'Не указан'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Опыт работы">
                    {selectedReport.candidate.candidate_profile?.experience_years || 0} лет
                  </Descriptions.Item>
                  <Descriptions.Item label="Текущая позиция">
                    {selectedReport.candidate.candidate_profile?.current_position || 'Не указана'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Образование">
                    {selectedReport.candidate.candidate_profile?.education || 'Не указано'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Локация">
                    {selectedReport.candidate.candidate_profile?.location || 'Не указана'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col span={24}>
                <Title level={5}>Навыки</Title>
                <Text>{selectedReport.candidate.candidate_profile?.skills || 'Не указаны'}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>Детали интервью</Title>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Дата интервью">
                    <CalendarOutlined /> {new Date(selectedReport.created_at).toLocaleDateString('ru-RU')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Длительность">
                    <ClockCircleOutlined /> {selectedReport.interview_duration || 0} минут
                  </Descriptions.Item>
                  <Descriptions.Item label="Вопросов отвечено">
                    <FileTextOutlined /> {selectedReport.questions_answered || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Статус">
                    <Tag color={getStatusColor(selectedReport.status)}>
                      {getStatusText(selectedReport.status)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col span={24}>
                <Divider />
                <Title level={5}>Результаты оценки</Title>
                
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Progress 
                          type="circle" 
                          size={80} 
                          percent={selectedReport.overall_score}
                          strokeColor={getScoreColor(selectedReport.overall_score || 0)}
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
                          size={80} 
                          percent={selectedReport.technical_score}
                          strokeColor={getScoreColor(selectedReport.technical_score || 0)}
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
                          size={80} 
                          percent={selectedReport.communication_score}
                          strokeColor={getScoreColor(selectedReport.communication_score || 0)}
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
                          size={80} 
                          percent={selectedReport.experience_score}
                          strokeColor={getScoreColor(selectedReport.experience_score || 0)}
                        />
                        <div style={{ marginTop: 8, fontWeight: 'bold' }}>Опыт</div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Title level={5}>Сильные стороны</Title>
                    <List
                      size="small"
                      dataSource={selectedReport.strengths}
                      renderItem={(item) => (
                        <List.Item>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Col>
                  <Col span={12}>
                    <Title level={5}>Области для улучшения</Title>
                    <List
                      size="small"
                      dataSource={selectedReport.weaknesses}
                      renderItem={(item) => (
                        <List.Item>
                          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Title level={5}>Рекомендации</Title>
                <List
                  size="small"
                  dataSource={selectedReport.recommendations}
                  renderItem={(item) => (
                    <List.Item>
                      <TrophyOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
              </Col>

              <Col span={24}>
                <Title level={5}>Детальный анализ</Title>
                <Text>{selectedReport.detailed_analysis}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>AI заметки</Title>
                <Alert
                  message="Анализ искусственного интеллекта"
                  description={selectedReport.ai_notes}
                  type="info"
                  showIcon
                />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewReports;
