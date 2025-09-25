import React, { useState, useEffect, useCallback } from 'react';
import { Card, Progress, Typography, Row, Col, Statistic, Badge, Tooltip, Space, Button, Modal } from 'antd';
import { 
  SoundOutlined, 
  EyeOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  TrophyOutlined,
  BulbOutlined,
  RiseOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface SpeechMetrics {
  volume: number;
  clarity: number;
  pace: number;
  confidence: number;
  emotion: 'positive' | 'neutral' | 'negative';
  energy: number;
}

interface PerformanceMetrics {
  responseTime: number;
  completeness: number;
  relevance: number;
  structure: number;
  engagement: number;
}

interface InterviewMetrics {
  speech: SpeechMetrics;
  performance: PerformanceMetrics;
  overall: number;
  trends: {
    improvement: number;
    consistency: number;
    adaptability: number;
  };
}

interface AdvancedMetricsProps {
  metrics: InterviewMetrics;
  isRealTime?: boolean;
  showDetails?: boolean;
  onMetricsChange?: (metrics: InterviewMetrics) => void;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = ({
  metrics,
  isRealTime = true,
  showDetails = true,
  onMetricsChange
}) => {
  const [detailedView, setDetailedView] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<InterviewMetrics[]>([]);

  // Симуляция исторических данных для демонстрации
  useEffect(() => {
    if (isRealTime) {
      const interval = setInterval(() => {
        const newMetrics = {
          ...metrics,
          speech: {
            ...metrics.speech,
            volume: Math.max(0, Math.min(100, metrics.speech.volume + (Math.random() - 0.5) * 10)),
            clarity: Math.max(0, Math.min(100, metrics.speech.clarity + (Math.random() - 0.5) * 5)),
            pace: Math.max(0, Math.min(100, metrics.speech.pace + (Math.random() - 0.5) * 8)),
            confidence: Math.max(0, Math.min(100, metrics.speech.confidence + (Math.random() - 0.5) * 6)),
            energy: Math.max(0, Math.min(100, metrics.speech.energy + (Math.random() - 0.5) * 7))
          },
          performance: {
            ...metrics.performance,
            responseTime: Math.max(0, metrics.performance.responseTime + (Math.random() - 0.5) * 2),
            completeness: Math.max(0, Math.min(100, metrics.performance.completeness + (Math.random() - 0.5) * 3)),
            relevance: Math.max(0, Math.min(100, metrics.performance.relevance + (Math.random() - 0.5) * 4)),
            structure: Math.max(0, Math.min(100, metrics.performance.structure + (Math.random() - 0.5) * 3)),
            engagement: Math.max(0, Math.min(100, metrics.performance.engagement + (Math.random() - 0.5) * 5))
          }
        };
        
        setHistoricalData(prev => [...prev.slice(-9), newMetrics]);
        onMetricsChange?.(newMetrics);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRealTime, metrics, onMetricsChange]);

  const getMetricColor = (value: number, type: 'positive' | 'negative' = 'positive') => {
    if (type === 'negative') {
      return value > 70 ? '#ff4d4f' : value > 40 ? '#faad14' : '#52c41a';
    }
    return value > 70 ? '#52c41a' : value > 40 ? '#faad14' : '#ff4d4f';
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'positive': return '#52c41a';
      case 'neutral': return '#faad14';
      case 'negative': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const renderSpeechMetrics = () => (
    <Card 
      title={
        <Space>
          <SoundOutlined style={{ color: '#a8edea' }} />
          <Text style={{ color: 'rgba(255,255,255,0.95)' }}>Анализ речи</Text>
        </Space>
      }
      className="metrics-card"
      extra={
        <Tooltip title="Детальная информация о качестве речи">
          <Button 
            type="text" 
            icon={<InfoCircleOutlined />}
            onClick={() => setSelectedMetric('speech')}
          />
        </Tooltip>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Громкость</Text>
              <Text strong style={{ color: getMetricColor(metrics.speech.volume) }}>
                {Math.round(metrics.speech.volume)}%
              </Text>
            </div>
            <Progress
              percent={metrics.speech.volume}
              strokeColor={getMetricColor(metrics.speech.volume)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Четкость</Text>
              <Text strong style={{ color: getMetricColor(metrics.speech.clarity) }}>
                {Math.round(metrics.speech.clarity)}%
              </Text>
            </div>
            <Progress
              percent={metrics.speech.clarity}
              strokeColor={getMetricColor(metrics.speech.clarity)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Темп</Text>
              <Text strong style={{ color: getMetricColor(metrics.speech.pace) }}>
                {Math.round(metrics.speech.pace)}%
              </Text>
            </div>
            <Progress
              percent={metrics.speech.pace}
              strokeColor={getMetricColor(metrics.speech.pace)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Уверенность</Text>
              <Text strong style={{ color: getMetricColor(metrics.speech.confidence) }}>
                {Math.round(metrics.speech.confidence)}%
              </Text>
            </div>
            <Progress
              percent={metrics.speech.confidence}
              strokeColor={getMetricColor(metrics.speech.confidence)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Энергия</Text>
              <Text strong style={{ color: getMetricColor(metrics.speech.energy) }}>
                {Math.round(metrics.speech.energy)}%
              </Text>
            </div>
            <Progress
              percent={metrics.speech.energy}
              strokeColor={getMetricColor(metrics.speech.energy)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Эмоции</Text>
              <Space>
                <Text style={{ fontSize: '16px' }}>
                  {getEmotionIcon(metrics.speech.emotion)}
                </Text>
                <Text strong style={{ color: getEmotionColor(metrics.speech.emotion) }}>
                  {metrics.speech.emotion}
                </Text>
              </Space>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderPerformanceMetrics = () => (
    <Card 
      title={
        <Space>
          <TrophyOutlined style={{ color: '#a8edea' }} />
          <Text style={{ color: 'rgba(255,255,255,0.95)' }}>Качество ответов</Text>
        </Space>
      }
      className="metrics-card"
      extra={
        <Tooltip title="Детальная информация о качестве ответов">
          <Button 
            type="text" 
            icon={<InfoCircleOutlined />}
            onClick={() => setSelectedMetric('performance')}
          />
        </Tooltip>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Время ответа</Text>
              <Text strong style={{ color: getMetricColor(100 - metrics.performance.responseTime, 'negative') }}>
                {metrics.performance.responseTime.toFixed(1)}с
              </Text>
            </div>
            <Progress
              percent={Math.max(0, 100 - metrics.performance.responseTime * 2)}
              strokeColor={getMetricColor(100 - metrics.performance.responseTime, 'negative')}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Полнота</Text>
              <Text strong style={{ color: getMetricColor(metrics.performance.completeness) }}>
                {Math.round(metrics.performance.completeness)}%
              </Text>
            </div>
            <Progress
              percent={metrics.performance.completeness}
              strokeColor={getMetricColor(metrics.performance.completeness)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Релевантность</Text>
              <Text strong style={{ color: getMetricColor(metrics.performance.relevance) }}>
                {Math.round(metrics.performance.relevance)}%
              </Text>
            </div>
            <Progress
              percent={metrics.performance.relevance}
              strokeColor={getMetricColor(metrics.performance.relevance)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Структурированность</Text>
              <Text strong style={{ color: getMetricColor(metrics.performance.structure) }}>
                {Math.round(metrics.performance.structure)}%
              </Text>
            </div>
            <Progress
              percent={metrics.performance.structure}
              strokeColor={getMetricColor(metrics.performance.structure)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={8} md={6}>
          <div className="metric-item">
            <div className="metric-header">
              <Text type="secondary">Вовлеченность</Text>
              <Text strong style={{ color: getMetricColor(metrics.performance.engagement) }}>
                {Math.round(metrics.performance.engagement)}%
              </Text>
            </div>
            <Progress
              percent={metrics.performance.engagement}
              strokeColor={getMetricColor(metrics.performance.engagement)}
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderTrendsMetrics = () => (
    <Card 
      title={
        <Space>
          <RiseOutlined style={{ color: '#a8edea' }} />
          <Text style={{ color: 'rgba(255,255,255,0.95)' }}>Тренды и развитие</Text>
        </Space>
      }
      className="metrics-card"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Улучшение"
            value={metrics.trends.improvement}
            suffix="%"
            valueStyle={{ color: metrics.trends.improvement > 0 ? '#52c41a' : '#ff4d4f' }}
            prefix={metrics.trends.improvement > 0 ? <RiseOutlined /> : <RiseOutlined style={{ transform: 'rotate(180deg)' }} />}
          />
        </Col>
        
        <Col xs={24} sm={8}>
          <Statistic
            title="Стабильность"
            value={metrics.trends.consistency}
            suffix="%"
            valueStyle={{ color: getMetricColor(metrics.trends.consistency) }}
            prefix={<BarChartOutlined />}
          />
        </Col>
        
        <Col xs={24} sm={8}>
          <Statistic
            title="Адаптивность"
            value={metrics.trends.adaptability}
            suffix="%"
            valueStyle={{ color: getMetricColor(metrics.trends.adaptability) }}
            prefix={<LineChartOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderOverallScore = () => (
    <Card className="overall-score-card">
      <div className="overall-score-content">
        <div className="score-circle">
          <Progress
            type="circle"
            percent={metrics.overall}
            strokeColor={getMetricColor(metrics.overall)}
            strokeWidth={8}
            size={120}
            format={() => (
              <div className="score-text">
                <Text style={{ fontSize: '24px', fontWeight: 'bold', color: getMetricColor(metrics.overall) }}>
                  {Math.round(metrics.overall)}
                </Text>
                <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  /100
                </Text>
              </div>
            )}
          />
        </div>
        <div className="score-info">
          <Title level={4} style={{ color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            Общая оценка
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            {metrics.overall > 80 ? 'Отличная работа!' : 
             metrics.overall > 60 ? 'Хорошая работа!' : 
             metrics.overall > 40 ? 'Неплохо, есть куда расти' : 'Нужно больше практики'}
          </Text>
        </div>
      </div>
    </Card>
  );

  const renderDetailedModal = () => (
    <Modal
      title={`Детальная информация: ${selectedMetric === 'speech' ? 'Анализ речи' : 'Качество ответов'}`}
      open={!!selectedMetric}
      onCancel={() => setSelectedMetric(null)}
      footer={null}
      width={800}
      className="metrics-detail-modal"
    >
      {selectedMetric === 'speech' && (
        <div className="detailed-speech-metrics">
          <Title level={5}>Рекомендации по улучшению речи:</Title>
          <ul>
            <li>Громкость: {metrics.speech.volume < 50 ? 'Попробуйте говорить громче' : 'Отличная громкость'}</li>
            <li>Четкость: {metrics.speech.clarity < 60 ? 'Говорите более четко и медленно' : 'Отличная четкость'}</li>
            <li>Темп: {metrics.speech.pace > 80 ? 'Говорите немного медленнее' : metrics.speech.pace < 30 ? 'Можете говорить быстрее' : 'Отличный темп'}</li>
            <li>Уверенность: {metrics.speech.confidence < 50 ? 'Будьте более уверенными в себе' : 'Отличная уверенность'}</li>
          </ul>
        </div>
      )}
      
      {selectedMetric === 'performance' && (
        <div className="detailed-performance-metrics">
          <Title level={5}>Рекомендации по качеству ответов:</Title>
          <ul>
            <li>Время ответа: {metrics.performance.responseTime > 5 ? 'Отвечайте быстрее' : 'Отличное время ответа'}</li>
            <li>Полнота: {metrics.performance.completeness < 60 ? 'Давайте более развернутые ответы' : 'Отличная полнота'}</li>
            <li>Релевантность: {metrics.performance.relevance < 70 ? 'Будьте более конкретными' : 'Отличная релевантность'}</li>
            <li>Структурированность: {metrics.performance.structure < 60 ? 'Структурируйте ответы лучше' : 'Отличная структура'}</li>
          </ul>
        </div>
      )}
    </Modal>
  );

  return (
    <div className="advanced-metrics">
      <div className="metrics-header">
        <Title level={3} style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1rem' }}>
          <BarChartOutlined style={{ color: '#a8edea', marginRight: '8px' }} />
          Продвинутая аналитика
        </Title>
        {isRealTime && (
          <Badge 
            status="processing" 
            text="Обновление в реальном времени" 
            style={{ color: 'rgba(255,255,255,0.7)' }}
          />
        )}
      </div>

      <div className="metrics-grid">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            {renderSpeechMetrics()}
            {renderPerformanceMetrics()}
            {renderTrendsMetrics()}
          </Col>
          
          <Col xs={24} lg={8}>
            {renderOverallScore()}
          </Col>
        </Row>
      </div>

      {renderDetailedModal()}
    </div>
  );
};

export default AdvancedMetrics;
