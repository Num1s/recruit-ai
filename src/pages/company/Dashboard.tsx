import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Tag, 
  Space, 
  Avatar, 
  Dropdown, 
  Table, 
  Tabs,
  Statistic,
  Row,
  Col,
  Progress
} from 'antd';
import { 
  LogoutOutlined, 
  UserOutlined, 
  SettingOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';

const { Title, Text } = Typography;

interface Candidate {
  id: string;
  name: string;
  position: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'report_ready';
  interview_date: string;
  score?: number;
  avatar?: string;
  email: string;
}

interface JobVacancy {
  id: string;
  title: string;
  candidates_count: number;
  status: 'active' | 'paused' | 'closed';
  created_date: string;
}

const CompanyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Моковые данные для кандидатов
      const mockCandidates: Candidate[] = [
        {
          id: '1',
          name: 'Алексей Петров',
          position: 'Senior Frontend Developer',
          status: 'report_ready',
          interview_date: '2025-01-15',
          score: 4.2,
          email: 'alexey@example.com'
        },
        {
          id: '2',
          name: 'Мария Сидорова',
          position: 'Python Backend Developer',
          status: 'completed',
          interview_date: '2025-01-14',
          score: 3.8,
          email: 'maria@example.com'
        },
        {
          id: '3',
          name: 'Дмитрий Иванов',
          position: 'Full Stack Developer',
          status: 'in_progress',
          interview_date: '2025-01-16',
          email: 'dmitry@example.com'
        },
        {
          id: '4',
          name: 'Анна Козлова',
          position: 'Senior Frontend Developer',
          status: 'scheduled',
          interview_date: '2025-01-17',
          email: 'anna@example.com'
        }
      ];

      // Моковые данные для вакансий
      const mockVacancies: JobVacancy[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          candidates_count: 12,
          status: 'active',
          created_date: '2025-01-10'
        },
        {
          id: '2',
          title: 'Python Backend Developer',
          candidates_count: 8,
          status: 'active',
          created_date: '2025-01-08'
        },
        {
          id: '3',
          title: 'Full Stack Developer',
          candidates_count: 15,
          status: 'active',
          created_date: '2025-01-12'
        }
      ];

      setCandidates(mockCandidates);
      setVacancies(mockVacancies);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'report_ready': return 'purple';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Назначено';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Выполнено';
      case 'report_ready': return 'Отчет готов';
      default: return status;
    }
  };

  const handleViewReport = (candidateId: string) => {
    navigate(`/company/candidate/${candidateId}/report`);
  };

  const candidateColumns = [
    {
      title: 'Кандидат',
      key: 'candidate',
      render: (record: Candidate) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Вакансия',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: Candidate) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: 'Дата интервью',
      key: 'interview_date',
      render: (record: Candidate) => (
        new Date(record.interview_date).toLocaleDateString('ru-RU')
      ),
    },
    {
      title: 'Оценка',
      key: 'score',
      render: (record: Candidate) => (
        record.score ? (
          <div>
            <Progress 
              percent={record.score * 20} 
              size="small" 
              format={() => `${record.score}/5`}
              strokeColor={record.score >= 4 ? '#52c41a' : record.score >= 3 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Candidate) => (
        <Space>
          {record.status === 'report_ready' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record.id)}
            >
              Отчет
            </Button>
          )}
          {record.status === 'completed' && (
            <Button 
              type="default" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record.id)}
            >
              Отчет
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const vacancyColumns = [
    {
      title: 'Название вакансии',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Кандидатов',
      dataIndex: 'candidates_count',
      key: 'candidates_count',
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: JobVacancy) => (
        <Tag color={record.status === 'active' ? 'green' : record.status === 'paused' ? 'orange' : 'red'}>
          {record.status === 'active' ? 'Активна' : record.status === 'paused' ? 'Приостановлена' : 'Закрыта'}
        </Tag>
      ),
    },
    {
      title: 'Дата создания',
      key: 'created_date',
      render: (record: JobVacancy) => (
        new Date(record.created_date).toLocaleDateString('ru-RU')
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: JobVacancy) => (
        <Space>
          <Button size="small">Редактировать</Button>
          <Button size="small" danger>Закрыть</Button>
        </Space>
      ),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль компании',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: logout,
    },
  ];

  const totalCandidates = candidates.length;
  const completedInterviews = candidates.filter(c => c.status === 'completed' || c.status === 'report_ready').length;
  const activeVacancies = vacancies.filter(v => v.status === 'active').length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Recruit.ai
          </Title>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
          >
            Создать вакансию
          </Button>
          <Dropdown 
            menu={{ items: userMenuItems }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.first_name} {user?.last_name}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>

      <div className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <Title level={2}>
            Панель управления
          </Title>
          
          {/* Статистика */}
          <Row gutter={16} style={{ marginBottom: '2rem' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Всего кандидатов"
                  value={totalCandidates}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Завершенных интервью"
                  value={completedInterviews}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Активных вакансий"
                  value={activeVacancies}
                  prefix={<FolderOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="В процессе"
                  value={candidates.filter(c => c.status === 'in_progress').length}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* Вкладки */}
        <Card>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'candidates',
                label: 'Кандидаты',
                children: (
                  <Table
                    columns={candidateColumns}
                    dataSource={candidates}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} из ${total} кандидатов`,
                    }}
                  />
                )
              },
              {
                key: 'vacancies',
                label: 'Вакансии',
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Button type="primary" icon={<PlusOutlined />}>
                        Создать новую вакансию
                      </Button>
                    </div>
                    <Table
                      columns={vacancyColumns}
                      dataSource={vacancies}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} из ${total} вакансий`,
                      }}
                    />
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;
