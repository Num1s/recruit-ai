import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  Progress, 
  Tag, 
  Space, 
  Button,
  Row,
  Col,
  Divider,
  Avatar,
  Table,
  Alert,
  Timeline,
  Rate
} from 'antd';
import { 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CandidateReportData {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    avatar?: string;
  };
  overall: {
    score: number;
    recommendation: 'recommend' | 'consider' | 'do_not_recommend';
    summary: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  assessment_rubrics: Array<{
    category: string;
    score: number;
    max_score: number;
    comment: string;
  }>;
  communication_skills: {
    grammar: number;
    comprehension: number;
    fluency: number;
    vocabulary: number;
    coherence: number;
  };
  cognitive_insights: {
    logical_reasoning: number;
    critical_thinking: number;
    problem_solving: number;
    big_picture_thinking: number;
    insightfulness: number;
    clarity: number;
  };
  integrity_signals: {
    multiple_faces_detected: boolean;
    face_out_of_view: boolean;
    eye_contact_quality: 'strong' | 'neutral' | 'weak';
    general_expression: 'positive' | 'neutral' | 'negative';
  };
  cv_check: {
    status: 'confirmed' | 'suspicious' | 'not_found';
    certificates_verified: Array<{
      name: string;
      status: 'confirmed' | 'not_found' | 'suspicious';
    }>;
    timeline_analysis: string;
    digital_footprint: string[];
  };
  transcript: Array<{
    timestamp: string;
    speaker: 'ai' | 'candidate';
    text: string;
  }>;
  video_url?: string;
}

const CandidateReport: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<CandidateReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [candidateId]);

  const loadReportData = async () => {
    try {
      // Моковые данные отчета
      const mockReport: CandidateReportData = {
        candidate: {
          id: candidateId!,
          name: 'Алексей Петров',
          email: 'alexey@example.com',
          position: 'Senior Frontend Developer'
        },
        overall: {
          score: 4.2,
          recommendation: 'recommend',
          summary: 'Кандидат демонстрирует сильные технические навыки и хорошие коммуникативные способности. Рекомендуется к найму на позицию Senior Frontend Developer.'
        },
        strengths: [
          'Глубокие знания React и TypeScript',
          'Хорошие навыки решения проблем',
          'Четкая коммуникация',
          'Опыт работы с современными инструментами разработки'
        ],
        weaknesses: [
          'Ограниченный опыт с backend технологиями',
          'Может улучшить навыки тестирования',
          'Недостаточно опыта в управлении командой'
        ],
        recommendations: [
          'Рассмотреть для позиции Senior Frontend Developer',
          'Предоставить дополнительное обучение по backend технологиям',
          'Включить в план развития лидерские навыки'
        ],
        assessment_rubrics: [
          { category: 'Communication and Teamwork', score: 4.5, max_score: 5, comment: 'Отличные коммуникативные навыки' },
          { category: 'Technical Skills', score: 4.0, max_score: 5, comment: 'Сильные технические знания' },
          { category: 'Problem Solving', score: 4.2, max_score: 5, comment: 'Хорошие аналитические способности' },
          { category: 'Attention to Detail', score: 3.8, max_score: 5, comment: 'Может улучшить внимание к деталям' }
        ],
        communication_skills: {
          grammar: 4.0,
          comprehension: 4.5,
          fluency: 3.8,
          vocabulary: 4.2,
          coherence: 4.1
        },
        cognitive_insights: {
          logical_reasoning: 4.0,
          critical_thinking: 3.9,
          problem_solving: 4.2,
          big_picture_thinking: 3.5,
          insightfulness: 3.8,
          clarity: 4.1
        },
        integrity_signals: {
          multiple_faces_detected: false,
          face_out_of_view: false,
          eye_contact_quality: 'strong',
          general_expression: 'positive'
        },
        cv_check: {
          status: 'confirmed',
          certificates_verified: [
            { name: 'AWS Certified Developer', status: 'confirmed' },
            { name: 'React Professional Certificate', status: 'confirmed' },
            { name: 'Google Cloud Certificate', status: 'not_found' }
          ],
          timeline_analysis: 'Временная линия карьеры выглядит логично и последовательно',
          digital_footprint: [
            'LinkedIn профиль подтвержден',
            'GitHub активность соответствует заявленному опыту',
            'Профессиональные публикации найдены'
          ]
        },
        transcript: [
          { timestamp: '00:00', speaker: 'ai', text: 'Добро пожаловать на интервью! Расскажите о себе.' },
          { timestamp: '00:05', speaker: 'candidate', text: 'Здравствуйте! Меня зовут Алексей, я Frontend разработчик с 5-летним опытом...' },
          { timestamp: '02:30', speaker: 'ai', text: 'Какие технологии вы используете в своей работе?' },
          { timestamp: '02:35', speaker: 'candidate', text: 'Основные технологии - React, TypeScript, Next.js...' }
        ]
      };

      setReportData(mockReport);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки отчета:', error);
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'recommend': return 'success';
      case 'consider': return 'warning';
      case 'do_not_recommend': return 'error';
      default: return 'default';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'recommend': return 'Рекомендовать';
      case 'consider': return 'Рассмотреть';
      case 'do_not_recommend': return 'Не рекомендовать';
      default: return recommendation;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#52c41a';
    if (score >= 3) return '#faad14';
    return '#ff4d4f';
  };

  const renderOverview = () => (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card title="Общая оценка" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress
                type="circle"
                percent={reportData!.overall.score * 20}
                format={() => `${reportData!.overall.score}/5`}
                strokeColor={getScoreColor(reportData!.overall.score)}
                size={120}
              />
            </div>
            <Alert
              message={getRecommendationText(reportData!.overall.recommendation)}
              description={reportData!.overall.summary}
              type={getRecommendationColor(reportData!.overall.recommendation)}
              showIcon
            />
          </Card>

          <Card title="Сильные стороны" style={{ marginBottom: 24 }}>
            <ul>
              {reportData!.strengths.map((strength, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {strength}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Области для улучшения">
            <ul>
              {reportData!.weaknesses.map((weakness, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                  {weakness}
                </li>
              ))}
            </ul>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Информация о кандидате">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div style={{ marginTop: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>{reportData!.candidate.name}</Title>
                  <Text type="secondary">{reportData!.candidate.email}</Text>
                </div>
              </div>
              <Divider />
              <div>
                <Text strong>Позиция:</Text>
                <div>{reportData!.candidate.position}</div>
              </div>
            </Space>
          </Card>

          <Card title="Рекомендации HR" style={{ marginTop: 16 }}>
            {reportData!.recommendations.map((rec, index) => (
              <div key={index} style={{ marginBottom: 12 }}>
                <Tag color="blue">{index + 1}</Tag>
                {rec}
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderAssessmentRubrics = () => (
    <div>
      {reportData!.assessment_rubrics.map((rubric, index) => (
        <Card key={index} style={{ marginBottom: 16 }}>
          <Row align="middle">
            <Col span={8}>
              <Title level={5} style={{ margin: 0 }}>{rubric.category}</Title>
            </Col>
            <Col span={8}>
              <Progress
                percent={(rubric.score / rubric.max_score) * 100}
                format={() => `${rubric.score}/${rubric.max_score}`}
                strokeColor={getScoreColor(rubric.score)}
              />
            </Col>
            <Col span={8}>
              <Text type="secondary">{rubric.comment}</Text>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );

  const renderCommunicationSkills = () => (
    <Row gutter={16}>
      {Object.entries(reportData!.communication_skills).map(([skill, score]) => (
        <Col span={12} key={skill} style={{ marginBottom: 16 }}>
          <Card size="small">
            <div style={{ marginBottom: 8 }}>
              <Text strong>{skill.charAt(0).toUpperCase() + skill.slice(1)}</Text>
            </div>
            <Progress
              percent={score * 20}
              format={() => `${score}/5`}
              strokeColor={getScoreColor(score)}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderTranscript = () => (
    <div>
      <Timeline>
        {reportData!.transcript.map((entry, index) => (
          <Timeline.Item
            key={index}
            color={entry.speaker === 'ai' ? 'blue' : 'green'}
            dot={entry.speaker === 'ai' ? '🤖' : '👤'}
          >
            <div style={{ marginBottom: 4 }}>
              <Tag color={entry.speaker === 'ai' ? 'blue' : 'green'}>
                {entry.timestamp}
              </Tag>
              <Text strong>
                {entry.speaker === 'ai' ? 'AI' : 'Кандидат'}
              </Text>
            </div>
            <Paragraph>{entry.text}</Paragraph>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );

  const renderCVCheck = () => (
    <div>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Статус резюме" style={{ marginBottom: 16 }}>
            <Alert
              message={reportData!.cv_check.status === 'confirmed' ? 'Подтверждено' : 
                      reportData!.cv_check.status === 'suspicious' ? 'Сомнительно' : 'Не найдено'}
              type={reportData!.cv_check.status === 'confirmed' ? 'success' : 
                    reportData!.cv_check.status === 'suspicious' ? 'warning' : 'error'}
              showIcon
            />
          </Card>

          <Card title="Анализ временной линии">
            <Paragraph>{reportData!.cv_check.timeline_analysis}</Paragraph>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Проверка сертификатов" style={{ marginBottom: 16 }}>
            {reportData!.cv_check.certificates_verified.map((cert, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                {cert.status === 'confirmed' && <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                {cert.status === 'suspicious' && <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                {cert.status === 'not_found' && <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
                {cert.name}
              </div>
            ))}
          </Card>

          <Card title="Цифровой след">
            <ul>
              {reportData!.cv_check.digital_footprint.map((item, index) => (
                <li key={index} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (loading) {
    return <Card loading style={{ margin: 24 }} />;
  }

  if (!reportData) {
    return (
      <div style={{ padding: 24 }}>
        <Alert message="Отчет не найден" type="error" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/company/dashboard')}
          style={{ marginBottom: 16 }}
        >
          Назад к списку кандидатов
        </Button>
        
        <Card className="report-header" style={{ textAlign: 'center' }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            Отчет по кандидату: {reportData.candidate.name}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            {reportData.candidate.position}
          </Text>
        </Card>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab="Overview" key="overview" icon={<FileTextOutlined />}>
            {renderOverview()}
          </TabPane>
          
          <TabPane tab="Assessment Rubrics" key="rubrics">
            {renderAssessmentRubrics()}
          </TabPane>
          
          <TabPane tab="Communication Skills" key="communication">
            {renderCommunicationSkills()}
          </TabPane>
          
          <TabPane tab="Transcript" key="transcript" icon={<PlayCircleOutlined />}>
            {renderTranscript()}
          </TabPane>
          
          <TabPane tab="CV Check" key="cv-check">
            {renderCVCheck()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CandidateReport;
