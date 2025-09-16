import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Progress, 
  Alert, 
  List, 
  Space,
  Tag,
  Statistic,
  Divider,
  Button,
  Timeline
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FunnelPlotOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AIInsight {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  metric?: string;
  trend?: 'up' | 'down' | 'stable';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface AIInsightsProps {
  companyId?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ companyId }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [companyId]);

  const loadInsights = async () => {
    try {
      // Моковые данные AI-инсайтов
      const mockInsights: AIInsight[] = [
        {
          type: 'warning',
          title: 'Низкая конверсия на этапе интервью',
          description: 'Только 45% кандидатов завершают процесс интервью. Рекомендуется упростить процедуру или улучшить коммуникацию.',
          metric: '45%',
          trend: 'down',
          priority: 'high',
          actionable: true
        },
        {
          type: 'success',
          title: 'Высокое качество кандидатов',
          description: 'Средний рейтинг кандидатов составляет 4.2/5, что на 15% выше отраслевого стандарта.',
          metric: '4.2/5',
          trend: 'up',
          priority: 'low',
          actionable: false
        },
        {
          type: 'info',
          title: 'Тренд в навыках кандидатов',
          description: 'Растет количество кандидатов с опытом работы с AI/ML технологиями (+30% за последний месяц).',
          metric: '+30%',
          trend: 'up',
          priority: 'medium',
          actionable: true
        },
        {
          type: 'warning',
          title: 'Долгое время ответа на приглашения',
          description: 'Среднее время ответа кандидатов на приглашения составляет 3.2 дня, что может снижать заинтересованность.',
          metric: '3.2 дня',
          trend: 'up',
          priority: 'medium',
          actionable: true
        },
        {
          type: 'error',
          title: 'Проблемы с техническими интервью',
          description: 'Высокий процент отказов на этапе технической оценки (68%). Возможно, стоит пересмотреть сложность заданий.',
          metric: '68%',
          trend: 'up',
          priority: 'high',
          actionable: true
        }
      ];

      const mockFunnelData: FunnelStep[] = [
        { name: 'Приглашения отправлены', value: 150, percentage: 100, trend: 'stable' },
        { name: 'Приглашения приняты', value: 120, percentage: 80, trend: 'up' },
        { name: 'Интервью начаты', value: 85, percentage: 57, trend: 'down' },
        { name: 'Интервью завершены', value: 68, percentage: 45, trend: 'down' },
        { name: 'Положительные оценки', value: 35, percentage: 23, trend: 'stable' },
        { name: 'Рекомендованы к найму', value: 28, percentage: 19, trend: 'up' }
      ];

      setInsights(mockInsights);
      setFunnelData(mockFunnelData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading insights:', error);
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default: return <BulbOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const highPriorityInsights = insights.filter(insight => insight.priority === 'high');
  const actionableInsights = insights.filter(insight => insight.actionable);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <BulbOutlined style={{ marginRight: 8, color: '#722ed1' }} />
        AI Insights
      </Title>

      {/* Критические инсайты */}
      {highPriorityInsights.length > 0 && (
        <Alert
          message="Требуется внимание"
          description={`Обнаружено ${highPriorityInsights.length} критических проблем в процессе найма`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="text">
              Посмотреть все
            </Button>
          }
        />
      )}

      <Row gutter={24} style={{ marginBottom: 24 }}>
        {/* Воронка кандидатов */}
        <Col span={12}>
          <Card title="Воронка кандидатов" extra={<FunnelPlotOutlined />}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Анализ конверсии по этапам найма</Text>
            </div>
            
            {funnelData.map((step, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>{step.name}</Text>
                  <Space>
                    <Text>{step.value}</Text>
                    <Text type="secondary">({step.percentage}%)</Text>
                    {getTrendIcon(step.trend)}
                  </Space>
                </div>
                <Progress 
                  percent={step.percentage} 
                  showInfo={false}
                  strokeColor={step.percentage > 50 ? '#52c41a' : step.percentage > 30 ? '#faad14' : '#ff4d4f'}
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* Ключевые метрики */}
        <Col span={12}>
          <Card title="Ключевые метрики" extra={<TeamOutlined />}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Средняя оценка"
                  value={4.2}
                  precision={1}
                  suffix="/ 5"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Время найма"
                  value={14}
                  suffix="дней"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Успешных найма"
                  value={19}
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Активных вакансий"
                  value={8}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Список всех инсайтов */}
        <Col span={16}>
          <Card title="Рекомендации AI" loading={loading}>
            <List
              dataSource={insights}
              renderItem={(insight, index) => (
                <List.Item
                  key={index}
                  style={{ 
                    borderLeft: `4px solid ${insight.type === 'error' ? '#ff4d4f' : 
                                                insight.type === 'warning' ? '#faad14' : 
                                                insight.type === 'success' ? '#52c41a' : '#1890ff'}`,
                    paddingLeft: 16,
                    marginBottom: 12
                  }}
                >
                  <List.Item.Meta
                    avatar={getInsightIcon(insight.type)}
                    title={
                      <Space>
                        <Text strong>{insight.title}</Text>
                        <Tag color={getPriorityColor(insight.priority)}>
                          {insight.priority === 'high' ? 'Высокий' : 
                           insight.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                        </Tag>
                        {insight.actionable && <Tag color="blue">Требует действий</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph style={{ marginBottom: 8 }}>
                          {insight.description}
                        </Paragraph>
                        {insight.metric && (
                          <Space>
                            <Text strong>Метрика: {insight.metric}</Text>
                            {insight.trend && getTrendIcon(insight.trend)}
                          </Space>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Быстрые действия */}
        <Col span={8}>
          <Card title="Быстрые действия">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block>
                Упростить процесс интервью
              </Button>
              <Button type="default" block>
                Настроить уведомления
              </Button>
              <Button type="default" block>
                Изменить критерии оценки
              </Button>
              <Button type="default" block>
                Экспортировать отчет
              </Button>
            </Space>
          </Card>

          <Card title="Тренды" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                {
                  dot: <ArrowUpOutlined style={{ color: '#52c41a' }} />,
                  children: <Text>Рост качества кандидатов +15%</Text>,
                },
                {
                  dot: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />,
                  children: <Text>Снижение конверсии интервью -8%</Text>,
                },
                {
                  dot: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
                  children: <Text>Стабильное время найма</Text>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIInsights;
