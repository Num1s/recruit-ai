import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Typography, 
  Tag, 
  Space, 
  Button,
  Empty,
  Timeline,
  Progress,
  Descriptions,
  Rate,
  Modal,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  HistoryOutlined,
  EyeOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface InterviewHistoryItem {
  id: string;
  company_name: string;
  job_title: string;
  status: 'completed' | 'in_progress' | 'cancelled' | 'expired';
  date: string;
  duration: number; // в минутах
  score?: number;
  feedback?: {
    strengths: string[];
    improvements: string[];
    overall_rating: number;
    recommendation: string;
  };
  skills_assessed: string[];
  interview_type: 'technical' | 'behavioral' | 'combined';
}

interface InterviewHistoryProps {
  userId: string;
}

const InterviewHistory: React.FC<InterviewHistoryProps> = ({ userId }) => {
  const [interviews, setInterviews] = useState<InterviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewHistoryItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    loadInterviewHistory();
  }, [userId]);

  const loadInterviewHistory = async () => {
    setLoading(true);
    try {
      // Моковые данные истории интервью
      const mockHistory: InterviewHistoryItem[] = [
        {
          id: '1',
          company_name: 'TechCorp Кыргызстан',
          job_title: 'Senior Frontend Developer',
          status: 'completed',
          date: '2024-01-15T10:00:00Z',
          duration: 45,
          score: 4.2,
          feedback: {
            strengths: [
              'Отличные знания React и TypeScript',
              'Хорошие навыки решения проблем',
              'Четкая коммуникация'
            ],
            improvements: [
              'Углубить знания в области тестирования',
              'Изучить backend технологии',
              'Развивать лидерские навыки'
            ],
            overall_rating: 4.2,
            recommendation: 'Рекомендован к найму на позицию Senior Frontend Developer'
          },
          skills_assessed: ['React', 'TypeScript', 'JavaScript', 'Problem Solving', 'Communication'],
          interview_type: 'combined'
        },
        {
          id: '2',
          company_name: 'FinTech Solutions',
          job_title: 'Python Backend Developer',
          status: 'completed',
          date: '2024-01-10T14:30:00Z',
          duration: 38,
          score: 3.8,
          feedback: {
            strengths: [
              'Хорошее понимание Python',
              'Знание основ баз данных',
              'Готовность к обучению'
            ],
            improvements: [
              'Больше практики с микросервисами',
              'Изучить Docker и Kubernetes',
              'Развить навыки API дизайна'
            ],
            overall_rating: 3.8,
            recommendation: 'Подходит для позиции Middle Backend Developer с дополнительным обучением'
          },
          skills_assessed: ['Python', 'SQL', 'REST API', 'Problem Solving'],
          interview_type: 'technical'
        },
        {
          id: '3',
          company_name: 'StartupX',
          job_title: 'Full Stack Developer',
          status: 'in_progress',
          date: '2024-01-20T09:00:00Z',
          duration: 0,
          skills_assessed: ['React', 'Node.js', 'MongoDB'],
          interview_type: 'combined'
        },
        {
          id: '4',
          company_name: 'Digital Agency',
          job_title: 'Frontend Developer',
          status: 'cancelled',
          date: '2024-01-05T16:00:00Z',
          duration: 0,
          skills_assessed: ['Vue.js', 'CSS', 'JavaScript'],
          interview_type: 'technical'
        }
      ];

      setInterviews(mockHistory);
    } catch (error) {
      console.error('Error loading interview history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'cancelled': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in_progress': return 'В процессе';
      case 'cancelled': return 'Отменено';
      case 'expired': return 'Истекло';
      default: return status;
    }
  };

  const getInterviewTypeText = (type: string) => {
    switch (type) {
      case 'technical': return 'Техническое';
      case 'behavioral': return 'Поведенческое';
      case 'combined': return 'Комплексное';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showInterviewDetails = (interview: InterviewHistoryItem) => {
    setSelectedInterview(interview);
    setDetailsVisible(true);
  };

  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const averageScore = completedInterviews.length > 0 
    ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length
    : 0;

  const skillsFrequency = interviews
    .flatMap(i => i.skills_assessed)
    .reduce((acc: Record<string, number>, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {});

  const topSkills = Object.entries(skillsFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <HistoryOutlined style={{ marginRight: 8, color: '#722ed1' }} />
        История интервью
      </Title>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {interviews.length}
              </div>
              <div style={{ color: '#666' }}>Всего интервью</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {completedInterviews.length}
              </div>
              <div style={{ color: '#666' }}>Завершено</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {averageScore.toFixed(1)}
              </div>
              <div style={{ color: '#666' }}>Средний рейтинг</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {Math.round(completedInterviews.reduce((sum, i) => sum + i.duration, 0) / 60)}
              </div>
              <div style={{ color: '#666' }}>Часов интервью</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Список интервью */}
        <Col span={16}>
          <Card title="Ваши интервью">
            {interviews.length === 0 ? (
              <Empty 
                description="Пока нет завершенных интервью"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                loading={loading}
                dataSource={interviews}
                renderItem={(interview) => (
                  <List.Item
                    actions={[
                      interview.status === 'completed' && (
                        <Button 
                          type="link" 
                          icon={<EyeOutlined />}
                          onClick={() => showInterviewDetails(interview)}
                        >
                          Детали
                        </Button>
                      ),
                      interview.feedback && (
                        <Button type="link" icon={<FileTextOutlined />}>
                          Отчет
                        </Button>
                      )
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: '50%', 
                          backgroundColor: '#f0f2f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {interview.status === 'completed' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                           interview.status === 'in_progress' ? <PlayCircleOutlined style={{ color: '#1890ff' }} /> :
                           <ClockCircleOutlined style={{ color: '#d9d9d9' }} />}
                        </div>
                      }
                      title={
                        <Space>
                          <Text strong>{interview.company_name}</Text>
                          <Tag color={getStatusColor(interview.status)}>
                            {getStatusText(interview.status)}
                          </Tag>
                          {interview.score && (
                            <Tag color="gold">
                              <TrophyOutlined /> {interview.score}/5
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Text>{interview.job_title}</Text>
                          </div>
                          <Space size="middle">
                            <Text type="secondary">
                              <CalendarOutlined /> {formatDate(interview.date)}
                            </Text>
                            {interview.duration > 0 && (
                              <Text type="secondary">
                                <ClockCircleOutlined /> {interview.duration} мин
                              </Text>
                            )}
                            <Tag size="small">
                              {getInterviewTypeText(interview.interview_type)}
                            </Tag>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Аналитика навыков */}
        <Col span={8}>
          <Card title="Анализ навыков" style={{ marginBottom: 16 }}>
            <Title level={5}>Часто оцениваемые навыки:</Title>
            {topSkills.map(([skill, count]) => (
              <div key={skill} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{skill}</Text>
                  <Text type="secondary">{count} раз</Text>
                </div>
                <Progress 
                  percent={(count / interviews.length) * 100} 
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </div>
            ))}
          </Card>

          <Card title="Рекомендации">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <Text>Изучите основы системного дизайна</Text>
              </div>
              <div>
                <BookOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text>Практикуйте алгоритмы и структуры данных</Text>
              </div>
              <div>
                <BookOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                <Text>Развивайте soft skills</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Modal с деталями интервью */}
      <Modal
        title={`Детали интервью: ${selectedInterview?.company_name}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedInterview && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Компания">
                {selectedInterview.company_name}
              </Descriptions.Item>
              <Descriptions.Item label="Позиция">
                {selectedInterview.job_title}
              </Descriptions.Item>
              <Descriptions.Item label="Дата">
                {formatDate(selectedInterview.date)}
              </Descriptions.Item>
              <Descriptions.Item label="Длительность">
                {selectedInterview.duration} минут
              </Descriptions.Item>
              <Descriptions.Item label="Тип интервью">
                {getInterviewTypeText(selectedInterview.interview_type)}
              </Descriptions.Item>
              <Descriptions.Item label="Общая оценка">
                <Rate disabled value={selectedInterview.score} />
                <Text style={{ marginLeft: 8 }}>
                  {selectedInterview.score}/5
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Оцененные навыки:</Title>
            <Space wrap>
              {selectedInterview.skills_assessed.map((skill, index) => (
                <Tag key={index} color="blue">{skill}</Tag>
              ))}
            </Space>

            {selectedInterview.feedback && (
              <>
                <Divider />
                
                <Row gutter={24}>
                  <Col span={12}>
                    <Title level={5}>Сильные стороны:</Title>
                    <ul>
                      {selectedInterview.feedback.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </Col>
                  <Col span={12}>
                    <Title level={5}>Области для улучшения:</Title>
                    <ul>
                      {selectedInterview.feedback.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </Col>
                </Row>

                <Divider />
                
                <Title level={5}>Общая рекомендация:</Title>
                <Paragraph>{selectedInterview.feedback.recommendation}</Paragraph>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewHistory;
