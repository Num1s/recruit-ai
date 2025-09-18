import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Progress, Tag, Button, Space, Divider, List, Avatar, Modal, message } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  StarOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';

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
}

const InterviewReports: React.FC = () => {
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<InterviewReport | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCompanyReports();
      setReports(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке отчетов:', error);
      message.error('Ошибка при загрузке отчетов');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreText = (score: number) => {
    if (score >= 85) return 'Отлично';
    if (score >= 70) return 'Хорошо';
    if (score >= 50) return 'Удовлетворительно';
    return 'Требует улучшения';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Не указано';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  const handleViewReport = (report: InterviewReport) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const handleDownloadReport = (report: InterviewReport) => {
    // Здесь будет логика скачивания отчета
    message.info('Функция скачивания отчета будет реализована позже');
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>Загрузка отчетов...</Text>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <FileTextOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
        <Title level={3} type="secondary">Отчеты по интервью отсутствуют</Title>
        <Text type="secondary">
          Отчеты появятся после того, как кандидаты завершат интервью
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Отчеты по интервью</Title>
        <Text type="secondary">
          Анализ интервью кандидатов, проведенных с помощью ИИ
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {reports.map((report) => (
          <Col xs={24} sm={12} lg={8} key={report.id}>
            <Card
              hoverable
              actions={[
                <Button
                  key="view"
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewReport(report)}
                >
                  Подробнее
                </Button>,
                <Button
                  key="download"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadReport(report)}
                >
                  Скачать
                </Button>
              ]}
            >
              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Text strong>{report.candidate_name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {report.job_title}
                    </Text>
                  </div>
                </Space>
              </div>

              {report.overall_score && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Text strong>Общая оценка</Text>
                    <Tag color={getScoreColor(report.overall_score)}>
                      {report.overall_score}/100
                    </Tag>
                  </div>
                  <Progress
                    percent={report.overall_score}
                    strokeColor={getScoreColor(report.overall_score)}
                    showInfo={false}
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {getScoreText(report.overall_score)}
                  </Text>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <CalendarOutlined />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(report.completed_at || report.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </Space>
                <br />
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDuration(report.interview_duration)}
                  </Text>
                </Space>
              </div>

              {report.strengths && report.strengths.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: '12px' }}>Сильные стороны:</Text>
                  <br />
                  {report.strengths.slice(0, 2).map((strength, index) => (
                    <Tag key={index} color="green" style={{ marginTop: '4px', fontSize: '11px' }}>
                      {strength}
                    </Tag>
                  ))}
                  {report.strengths.length > 2 && (
                    <Tag color="default" style={{ marginTop: '4px', fontSize: '11px' }}>
                      +{report.strengths.length - 2} еще
                    </Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Модальное окно с детальным отчетом */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Детальный отчет по интервью</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedReport && handleDownloadReport(selectedReport)}
          >
            Скачать отчет
          </Button>
        ]}
        width={800}
      >
        {selectedReport && (
          <div>
            {/* Информация о кандидате */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Space>
                    <Avatar icon={<UserOutlined />} size="large" />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{selectedReport.candidate_name}</Title>
                      <Text type="secondary">{selectedReport.job_title}</Text>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'right' }}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <CalendarOutlined />
                        <Text>{new Date(selectedReport.completed_at || selectedReport.created_at).toLocaleString('ru-RU')}</Text>
                      </Space>
                      <Space>
                        <ClockCircleOutlined />
                        <Text>{formatDuration(selectedReport.interview_duration)}</Text>
                      </Space>
                      <Space>
                        <StarOutlined />
                        <Text>Вопросов: {selectedReport.questions_answered || 'Не указано'}</Text>
                      </Space>
                    </Space>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Оценки */}
            {selectedReport.overall_score && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Оценки</Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                      <Title level={2} style={{ margin: 0, color: getScoreColor(selectedReport.overall_score) }}>
                        {selectedReport.overall_score}
                      </Title>
                      <Text type="secondary">Общая оценка</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                      <Title level={2} style={{ margin: 0, color: getScoreColor(selectedReport.technical_score || 0) }}>
                        {selectedReport.technical_score || 'N/A'}
                      </Title>
                      <Text type="secondary">Техническая</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
                      <Title level={2} style={{ margin: 0, color: getScoreColor(selectedReport.communication_score || 0) }}>
                        {selectedReport.communication_score || 'N/A'}
                      </Title>
                      <Text type="secondary">Коммуникация</Text>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Сильные стороны */}
            {selectedReport.strengths && selectedReport.strengths.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Сильные стороны</Title>
                <List
                  dataSource={selectedReport.strengths}
                  renderItem={(item) => (
                    <List.Item>
                      <Tag color="green" style={{ margin: 0 }}>{item}</Tag>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Слабые стороны */}
            {selectedReport.weaknesses && selectedReport.weaknesses.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Области для улучшения</Title>
                <List
                  dataSource={selectedReport.weaknesses}
                  renderItem={(item) => (
                    <List.Item>
                      <Tag color="orange" style={{ margin: 0 }}>{item}</Tag>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Рекомендации */}
            {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Рекомендации</Title>
                <List
                  dataSource={selectedReport.recommendations}
                  renderItem={(item) => (
                    <List.Item>
                      <Tag color="blue" style={{ margin: 0 }}>{item}</Tag>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Детальный анализ */}
            {selectedReport.detailed_analysis && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Детальный анализ</Title>
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {selectedReport.detailed_analysis}
                </Paragraph>
              </div>
            )}

            {/* Заметки ИИ */}
            {selectedReport.ai_notes && (
              <div>
                <Title level={4}>Заметки ИИ</Title>
                <Paragraph style={{ whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                  {selectedReport.ai_notes}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewReports;
