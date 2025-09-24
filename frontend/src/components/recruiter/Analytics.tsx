import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  message,
  Tabs,
} from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  DownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface DashboardMetrics {
  total_jobs: number;
  total_applications: number;
  total_interviews: number;
  success_rate: number;
  streams_count: number;
  recruiters_count: number;
}

interface StreamAnalytics {
  stream_id: number;
  stream_name: string;
  senior_recruiter?: {
    id: number;
    name: string;
  };
  recruiters_count: number;
  recruiters: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  metrics: {
    total_jobs: number;
    total_applications: number;
    success_rate: number;
  };
}

interface RecruiterAnalytics {
  recruiter_id: number;
  name: string;
  email: string;
  role: string;
  stream?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  metrics: {
    total_jobs: number;
    total_applications: number;
    success_rate: number;
    last_activity?: string;
  };
}

const Analytics: React.FC = () => {
  const { user, isRecruiter, isSeniorRecruiter, isRecruitLead } = useAuth();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [streamsAnalytics, setStreamsAnalytics] = useState<StreamAnalytics[]>([]);
  const [recruitersAnalytics, setRecruitersAnalytics] = useState<RecruiterAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);
  const [selectedStreamId, setSelectedStreamId] = useState<number | undefined>();

  useEffect(() => {
    fetchDashboardMetrics();
    if (isSeniorRecruiter || isRecruitLead) {
      fetchStreamsAnalytics();
      fetchRecruitersAnalytics();
    }
  }, [periodDays]);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAnalyticsDashboard({ period_days: periodDays });
      setDashboardMetrics(response.data.metrics);
    } catch (error: any) {
      message.error('Ошибка при загрузке метрик');
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamsAnalytics = async () => {
    try {
      const response = await authAPI.getStreamsAnalytics();
      setStreamsAnalytics(response.data);
    } catch (error: any) {
      message.error('Ошибка при загрузке аналитики потоков');
      console.error('Error fetching streams analytics:', error);
    }
  };

  const fetchRecruitersAnalytics = async (streamId?: number) => {
    try {
      const response = await authAPI.getRecruitersAnalytics({ stream_id: streamId });
      setRecruitersAnalytics(response.data);
    } catch (error: any) {
      message.error('Ошибка при загрузке аналитики рекрутеров');
      console.error('Error fetching recruiters analytics:', error);
    }
  };

  const handleStreamFilter = (streamId: number | undefined) => {
    setSelectedStreamId(streamId);
    fetchRecruitersAnalytics(streamId);
  };

  const handleExport = async () => {
    try {
      const response = await authAPI.exportAnalytics({
        format: 'json',
        stream_id: selectedStreamId,
      });
      
      // Создаем и скачиваем файл
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Аналитика экспортирована');
    } catch (error: any) {
      message.error('Ошибка при экспорте аналитики');
      console.error('Error exporting analytics:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'recruit_lead':
        return 'red';
      case 'senior_recruiter':
        return 'orange';
      case 'recruiter':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'recruit_lead':
        return 'Главный рекрутер';
      case 'senior_recruiter':
        return 'Старший рекрутер';
      case 'recruiter':
        return 'Рекрутер';
      default:
        return role;
    }
  };

  const streamsColumns = [
    {
      title: 'Название потока',
      dataIndex: 'stream_name',
      key: 'stream_name',
    },
    {
      title: 'Старший рекрутер',
      dataIndex: ['senior_recruiter', 'name'],
      key: 'senior_recruiter',
      render: (name: string) => name || <Tag color="orange">Не назначен</Tag>,
    },
    {
      title: 'Количество рекрутеров',
      dataIndex: 'recruiters_count',
      key: 'recruiters_count',
      render: (count: number) => (
        <Statistic
          value={count}
          prefix={<UserOutlined />}
          valueStyle={{ fontSize: '16px' }}
        />
      ),
    },
    {
      title: 'Успешность (%)',
      dataIndex: ['metrics', 'success_rate'],
      key: 'success_rate',
      render: (rate: number) => (
        <Statistic
          value={rate}
          suffix="%"
          valueStyle={{ 
            fontSize: '16px',
            color: rate >= 50 ? '#52c41a' : rate >= 30 ? '#faad14' : '#ff4d4f'
          }}
        />
      ),
    },
  ];

  const recruitersColumns = [
    {
      title: 'Рекрутер',
      key: 'recruiter',
      render: (_, record: RecruiterAnalytics) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: 'Поток',
      dataIndex: ['stream', 'name'],
      key: 'stream',
      render: (name: string) => name || <Tag color="orange">Без потока</Tag>,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Активен' : 'Заблокирован'}
        </Tag>
      ),
    },
    {
      title: 'Заявки',
      dataIndex: ['metrics', 'total_applications'],
      key: 'total_applications',
      render: (count: number) => (
        <Statistic
          value={count}
          prefix={<BarChartOutlined />}
          valueStyle={{ fontSize: '14px' }}
        />
      ),
    },
    {
      title: 'Успешность (%)',
      dataIndex: ['metrics', 'success_rate'],
      key: 'success_rate',
      render: (rate: number) => (
        <Statistic
          value={rate}
          suffix="%"
          valueStyle={{ 
            fontSize: '14px',
            color: rate >= 50 ? '#52c41a' : rate >= 30 ? '#faad14' : '#ff4d4f'
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          Аналитика и отчеты
        </Title>
        <Space>
          <Select
            value={periodDays}
            onChange={setPeriodDays}
            style={{ width: 120 }}
          >
            <Option value={7}>7 дней</Option>
            <Option value={30}>30 дней</Option>
            <Option value={90}>90 дней</Option>
            <Option value={365}>1 год</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            Экспорт
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="dashboard">
        <TabPane tab="Дашборд" key="dashboard">
          <Spin spinning={loading}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Всего вакансий"
                    value={dashboardMetrics?.total_jobs || 0}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Всего заявок"
                    value={dashboardMetrics?.total_applications || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Всего интервью"
                    value={dashboardMetrics?.total_interviews || 0}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Успешность"
                    value={dashboardMetrics?.success_rate || 0}
                    suffix="%"
                    prefix={<TrophyOutlined />}
                    valueStyle={{
                      color: (dashboardMetrics?.success_rate || 0) >= 50 ? '#52c41a' : '#ff4d4f'
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {(isSeniorRecruiter || isRecruitLead) && (
              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Потоков"
                      value={dashboardMetrics?.streams_count || 0}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="Рекрутеров"
                      value={dashboardMetrics?.recruiters_count || 0}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </Spin>
        </TabPane>

        {(isSeniorRecruiter || isRecruitLead) && (
          <TabPane tab="Потоки" key="streams">
            <Card>
              <Table
                columns={streamsColumns}
                dataSource={streamsAnalytics}
                rowKey="stream_id"
                pagination={false}
              />
            </Card>
          </TabPane>
        )}

        {(isSeniorRecruiter || isRecruitLead) && (
          <TabPane tab="Рекрутеры" key="recruiters">
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Фильтр по потоку"
                  style={{ width: 200 }}
                  allowClear
                  onChange={handleStreamFilter}
                >
                  {streamsAnalytics.map((stream) => (
                    <Option key={stream.stream_id} value={stream.stream_id}>
                      {stream.stream_name}
                    </Option>
                  ))}
                </Select>
              </div>
              <Table
                columns={recruitersColumns}
                dataSource={recruitersAnalytics}
                rowKey="recruiter_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} из ${total} рекрутеров`,
                }}
              />
            </Card>
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default Analytics;
