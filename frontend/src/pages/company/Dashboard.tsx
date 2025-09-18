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
  ClockCircleOutlined,
  SearchOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { authAPI } from '../../services/api.ts';
import InviteCandidate from '../../components/company/InviteCandidate.tsx';
import AIInsights from '../../components/company/AIInsights.tsx';
import InterviewReports from './InterviewReports.tsx';
import CreateJobModal from '../../components/company/CreateJobModal.tsx';

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
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [createJobModalVisible, setCreateJobModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);
  const [editingJob, setEditingJob] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем реальные данные кандидатов
      const candidatesResponse = await authAPI.getCompanyCandidates();
      const candidatesData = candidatesResponse.data;
      
      // Преобразуем данные в формат, ожидаемый компонентом
      const formattedCandidates: Candidate[] = candidatesData.map((candidate: any) => ({
        id: candidate.id.toString(),
        name: candidate.candidate_name,
        position: candidate.job_title,
        status: mapApplicationStatusToInterviewStatus(candidate.status),
        interview_date: candidate.applied_at.split('T')[0], // Берем только дату
        score: candidate.candidate_experience_years ? Math.min(5, candidate.candidate_experience_years / 2) : undefined,
        email: candidate.candidate_email,
        avatar: candidate.candidate_avatar
      }));

      // Загружаем реальные вакансии компании
      const jobsResponse = await authAPI.getMyJobs({ 
        limit: 100 // Загружаем все вакансии компании
      });
      const jobsData = jobsResponse.data;
      
      // Преобразуем данные вакансий в формат, ожидаемый компонентом
      const formattedVacancies: JobVacancy[] = jobsData.map((job: any) => ({
        id: job.id.toString(),
        title: job.title,
        candidates_count: candidatesData.filter((c: any) => c.job_id === job.id).length,
        status: job.status === 'active' ? 'active' : job.status === 'paused' ? 'paused' : 'closed',
        created_date: job.created_at
      }));

      setCandidates(formattedCandidates);
      setVacancies(formattedVacancies);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // В случае ошибки показываем пустые данные
      setCandidates([]);
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция для преобразования статуса отклика в статус интервью
  const mapApplicationStatusToInterviewStatus = (status: string): 'scheduled' | 'in_progress' | 'completed' | 'report_ready' => {
    switch (status) {
      case 'applied':
        return 'scheduled';
      case 'reviewed':
        return 'scheduled';
      case 'interview_scheduled':
        return 'scheduled';
      case 'interview_completed':
        return 'completed';
      case 'accepted':
        return 'completed'; // Изменено с 'report_ready' на 'completed'
      case 'rejected':
        return 'completed';
      default:
        return 'scheduled';
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
    // Переключаемся на таб "Отчеты"
    setActiveTab('reports');
  };

  const handleViewJobCandidates = (jobId: string) => {
    navigate(`/company/jobs/${jobId}/candidates`);
  };

  const handleEditJob = async (jobId: string) => {
    try {
      // Загружаем полные данные вакансии
      const response = await authAPI.getJob(jobId);
      const jobData = response.data;
      
      // Устанавливаем данные для редактирования
      setEditingJob(jobData);
      
      // Открываем модальное окно редактирования
      setCreateJobModalVisible(true);
    } catch (error: any) {
      showError({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось загрузить данные вакансии'
      });
    }
  };

  const handleCloseJob = async (jobId: string) => {
    try {
      await authAPI.closeJob(jobId);
      
      showSuccess({
        title: 'Вакансия закрыта',
        message: 'Вакансия успешно закрыта'
      });
      
      // Перезагружаем данные
      loadDashboardData();
    } catch (error: any) {
      showError({
        title: 'Ошибка',
        message: error.response?.data?.detail || 'Не удалось закрыть вакансию'
      });
    }
  };

  const handleInviteCandidate = (jobId?: string, jobTitle?: string) => {
    setSelectedJob(jobId && jobTitle ? { id: jobId, title: jobTitle } : null);
    setInviteModalVisible(true);
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        navigate('/company/profile');
        break;
      case 'jobs':
        navigate('/company/jobs');
        break;
      case 'reports':
        navigate('/company/reports');
        break;
      case 'settings':
        navigate('/company/settings');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
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
          {(record.status === 'completed' || record.status === 'report_ready') && (
            <Button 
              type="primary" 
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
          <Button
            type="primary"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => handleViewJobCandidates(record.id)}
          >
            Кандидаты
          </Button>
          <Button 
            size="small"
            onClick={() => handleEditJob(record.id)}
          >
            Редактировать
          </Button>
          <Button 
            size="small" 
            danger
            onClick={() => handleCloseJob(record.id)}
          >
            Закрыть
          </Button>
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
      key: 'jobs',
      icon: <FolderOutlined />,
      label: 'Управление вакансиями',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Отчеты по интервью',
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
        <Space wrap>
          <Button 
            type="default" 
            icon={<SearchOutlined />}
            onClick={() => navigate('/company/candidates')}
          >
            Найти кандидатов
          </Button>
          <Button 
            type="default" 
            icon={<PlusOutlined />}
            onClick={() => handleInviteCandidate()}
          >
            Пригласить кандидата
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateJobModalVisible(true)}
          >
            Создать вакансию
          </Button>
          <Dropdown 
            menu={{ 
              items: userMenuItems,
              onClick: ({ key }) => handleMenuClick(key)
            }}
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
          <Title level={3} style={{ marginBottom: '1rem' }}>Статистика</Title>
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
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setCreateJobModalVisible(true)}
                      >
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
              },
              {
                key: 'ai-insights',
                label: 'AI Insights',
                children: <AIInsights companyId={user?.id.toString()} />
              },
              {
                key: 'reports',
                label: 'Отчеты',
                children: <InterviewReports />
              }
            ]}
          />
        </Card>
      </div>

      <InviteCandidate
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        jobId={selectedJob?.id}
        jobTitle={selectedJob?.title}
      />

      <CreateJobModal
        visible={createJobModalVisible}
        onClose={() => {
          setCreateJobModalVisible(false);
          setEditingJob(null);
        }}
        onSuccess={() => {
          // Перезагружаем данные после создания/редактирования вакансии
          loadDashboardData();
          setEditingJob(null);
        }}
        jobData={editingJob}
      />
    </div>
  );
};

export default CompanyDashboard;
