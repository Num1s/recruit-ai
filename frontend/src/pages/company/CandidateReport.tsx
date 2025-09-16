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
      default: return 'info';
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
              <Text strong>{skill.charAt(0).toUpperCase() + skill.slice(1).replace('_', ' ')}</Text>
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

  const renderCognitiveInsights = () => (
    <div>
      <Title level={4}>Когнитивные способности</Title>
      <Row gutter={16}>
        {Object.entries(reportData!.cognitive_insights).map(([skill, score]) => (
          <Col span={12} key={skill} style={{ marginBottom: 16 }}>
            <Card size="small">
              <div style={{ marginBottom: 8 }}>
                <Text strong>{skill.charAt(0).toUpperCase() + skill.slice(1).replace(/_/g, ' ')}</Text>
              </div>
              <Progress
                percent={score * 20}
                format={() => `${score}/5`}
                strokeColor={getScoreColor(score)}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {getCognitiveComment(skill, score)}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const getCognitiveComment = (skill: string, score: number) => {
    const comments: Record<string, Record<string, string>> = {
      logical_reasoning: {
        high: "Отличные способности к логическому мышлению",
        medium: "Хорошие навыки логического анализа",
        low: "Требуется развитие логического мышления"
      },
      critical_thinking: {
        high: "Превосходно анализирует информацию",
        medium: "Способен к критическому анализу",
        low: "Нуждается в развитии критического мышления"
      },
      problem_solving: {
        high: "Отлично решает сложные задачи",
        medium: "Хорошо справляется с проблемами",
        low: "Требует поддержки в решении задач"
      },
      big_picture_thinking: {
        high: "Видит стратегическую перспективу",
        medium: "Понимает общий контекст",
        low: "Фокусируется на деталях, упуская общую картину"
      },
      insightfulness: {
        high: "Проявляет глубокое понимание",
        medium: "Демонстрирует хорошую проницательность",
        low: "Поверхностное понимание вопросов"
      },
      clarity: {
        high: "Четко выражает мысли",
        medium: "Достаточно ясно излагает идеи",
        low: "Нуждается в улучшении ясности изложения"
      }
    };

    const level = score >= 4 ? 'high' : score >= 3 ? 'medium' : 'low';
    return comments[skill]?.[level] || 'Анализ недоступен';
  };

  const renderIntegritySignals = () => (
    <div>
      <Title level={4}>Сигналы честности и поведения</Title>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Технические показатели" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Обнаружено несколько лиц:</Text>
                <Tag color={reportData!.integrity_signals.multiple_faces_detected ? 'error' : 'success'}>
                  {reportData!.integrity_signals.multiple_faces_detected ? 'Да' : 'Нет'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Лицо вне зоны видимости:</Text>
                <Tag color={reportData!.integrity_signals.face_out_of_view ? 'warning' : 'success'}>
                  {reportData!.integrity_signals.face_out_of_view ? 'Да' : 'Нет'}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Поведенческие показатели" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Зрительный контакт:</Text>
                <Tag color={reportData!.integrity_signals.eye_contact_quality === 'strong' ? 'success' : 
                           reportData!.integrity_signals.eye_contact_quality === 'neutral' ? 'default' : 'warning'}>
                  {reportData!.integrity_signals.eye_contact_quality === 'strong' ? 'Сильный' :
                   reportData!.integrity_signals.eye_contact_quality === 'neutral' ? 'Нейтральный' : 'Слабый'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Общее выражение:</Text>
                <Tag color={reportData!.integrity_signals.general_expression === 'positive' ? 'success' : 
                           reportData!.integrity_signals.general_expression === 'neutral' ? 'default' : 'warning'}>
                  {reportData!.integrity_signals.general_expression === 'positive' ? 'Позитивное' :
                   reportData!.integrity_signals.general_expression === 'neutral' ? 'Нейтральное' : 'Негативное'}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Alert
        message="AI Анализ поведения"
        description="Кандидат демонстрировал естественное поведение на протяжении всего интервью. Зрительный контакт поддерживался стабильно, что указывает на честность и уверенность."
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </div>
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

  const renderCandidateCV = () => (
    <div>
      <Row gutter={24}>
        <Col span={8}>
          <Card title="CV Thumbnail" style={{ textAlign: 'center' }}>
            <div style={{ 
              height: '300px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <FileTextOutlined style={{ fontSize: '4rem', color: '#d9d9d9' }} />
            </div>
            <Button type="primary" block>Скачать резюме</Button>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card title="Профессиональные атрибуты">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Strategic Focus:</Text>
                  <div><Rate disabled value={0} /> N/A</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Learning Velocity:</Text>
                  <div><Rate disabled value={2} /> 2/5</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Career Progression:</Text>
                  <div><Rate disabled value={0} /> N/A</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Drive and Initiative:</Text>
                  <div><Rate disabled value={4.5} allowHalf /> 4.5/5</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Intellectual Ability:</Text>
                  <div><Rate disabled value={3.5} allowHalf /> 3.5/5</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Original and Creative Thinking:</Text>
                  <div><Rate disabled value={4} /> 4/5</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Attention to Detail:</Text>
                  <div><Rate disabled value={4} /> 4/5</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Clarity and Completeness:</Text>
                  <div><Rate disabled value={1} /> 1/5</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderRedFlagAnalysis = () => (
    <div>
      <Title level={4}>Анализ красных флагов</Title>
      
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Timeline Issues" style={{ marginBottom: 16 }}>
            <Alert 
              message="Проблем не обнаружено" 
              description="Временная линия карьеры выглядит логично и последовательно"
              type="success" 
              showIcon 
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Representation of Experience" style={{ marginBottom: 16 }}>
            <Alert 
              message="Достоверное" 
              description="Опыт работы соответствует заявленному в резюме"
              type="success" 
              showIcon 
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Other Risks" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>• Профиль LinkedIn актуален</Text>
              <Text>• GitHub активность соответствует</Text>
              <Text>• Рекомендации подтверждены</Text>
              <Text type="success">Дополнительных рисков не выявлено</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderKeyAttributes = () => (
    <div>
      <Title level={4}>Ключевые атрибуты и потенциал</Title>
      
      <Row gutter={24}>
        <Col span={12}>
          <Card title="Leadership Potential" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Progress 
                percent={72} 
                strokeColor="#722ed1"
                format={() => '3.6/5'}
              />
            </div>
            <Alert
              message="AI Пояснение"
              description="Кандидат демонстрирует базовые лидерские качества: способен выражать свои идеи, принимать решения в рамках проектов. Однако опыт управления командами ограничен."
              type="info"
              showIcon
            />
          </Card>
          
          <Card title="Entrepreneurial Spirit" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Progress 
                percent={68} 
                strokeColor="#fa8c16"
                format={() => '3.4/5'}
              />
            </div>
            <Alert
              message="AI Пояснение"
              description="Проявляет инициативу в техническом плане, готов изучать новые технологии. Видна мотивация к саморазвитию, но коммерческое мышление развито слабее."
              type="info"
              showIcon
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Estimated Career Potential">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: 16
              }}>
                <Text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>ВЫСОКИЙ</Text>
              </div>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Сильные стороны:</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Твердые технические навыки</li>
                  <li>Готовность к обучению</li>
                  <li>Хорошие коммуникативные способности</li>
                </ul>
              </div>
              
              <div>
                <Text strong>Рекомендации по развитию:</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Развивать лидерские навыки</li>
                  <li>Получить опыт управления проектами</li>
                  <li>Углубить знания в смежных областях</li>
                </ul>
              </div>
            </Space>
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
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="large"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              icon: <FileTextOutlined />,
              children: renderOverview(),
            },
            {
              key: 'rubrics',
              label: 'Assessment Rubrics',
              children: renderAssessmentRubrics(),
            },
            {
              key: 'communication',
              label: 'Communication Skills',
              children: renderCommunicationSkills(),
            },
            {
              key: 'cognitive',
              label: 'Cognitive Insights',
              children: renderCognitiveInsights(),
            },
            {
              key: 'integrity',
              label: 'Integrity Signals',
              children: renderIntegritySignals(),
            },
            {
              key: 'transcript',
              label: 'Transcript + Video',
              icon: <PlayCircleOutlined />,
              children: renderTranscript(),
            },
            {
              key: 'cv-check',
              label: 'CV Check',
              children: renderCVCheck(),
            },
            {
              key: 'candidate-cv',
              label: 'Candidate CV',
              children: renderCandidateCV(),
            },
            {
              key: 'red-flags',
              label: 'Red Flag Analysis',
              children: renderRedFlagAnalysis(),
            },
            {
              key: 'key-attributes',
              label: 'Key Attributes & Potential',
              children: renderKeyAttributes(),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CandidateReport;



