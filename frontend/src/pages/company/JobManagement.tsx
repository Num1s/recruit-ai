import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Table,
  Row,
  Col,
  Statistic,
  Dropdown,
  Modal,
  message,
  Badge,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';
import CreateJobModal from '../../components/company/CreateJobModal.tsx';

const { Title, Text } = Typography;

interface Job {
  id: number;
  title: string;
  description: string;
  job_type: string;
  experience_level: string;
  location?: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  status: string;
  is_ai_interview_enabled: boolean;
  max_candidates: number;
  created_at: string;
  candidates_count?: number;
}

const JobManagement: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Получаем вакансии только для текущей компании
      const companyId = (user as any)?.company_profile?.id;
      const response = await authAPI.getJobs({ company_id: companyId });
      setJobs(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки вакансий:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить список вакансий'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      await authAPI.updateJobStatus(jobId.toString(), newStatus);
      showSuccess({
        title: 'Статус изменен',
        message: 'Статус вакансии успешно обновлен'
      });
      loadJobs();
    } catch (error: any) {
      console.error('Ошибка изменения статуса:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось изменить статус вакансии'
      });
    }
  };

  const handleDeleteJob = (job: Job) => {
    Modal.confirm({
      title: 'Удалить вакансию?',
      content: `Вы уверены, что хотите удалить вакансию "${job.title}"? Это действие нельзя отменить.`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await authAPI.deleteJob(job.id.toString());
          showSuccess({
            title: 'Вакансия удалена',
            message: 'Вакансия успешно удалена'
          });
          loadJobs();
        } catch (error: any) {
          console.error('Ошибка удаления вакансии:', error);
          showError({
            title: 'Ошибка',
            message: 'Не удалось удалить вакансию'
          });
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'default',
      'active': 'green',
      'paused': 'orange',
      'closed': 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'draft': 'Черновик',
      'active': 'Активна',
      'paused': 'Приостановлена',
      'closed': 'Закрыта'
    };
    return labels[status] || status;
  };

  const getJobTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'full_time': 'Полная занятость',
      'part_time': 'Частичная занятость',
      'contract': 'Контракт',
      'internship': 'Стажировка'
    };
    return types[type] || type;
  };

  const getExperienceLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'intern': 'Стажер',
      'junior': 'Junior',
      'middle': 'Middle',
      'senior': 'Senior',
      'lead': 'Lead',
      'principal': 'Principal'
    };
    return levels[level] || level;
  };

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return 'Не указана';
    
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency}`;
    } else if (job.salary_min) {
      return `от ${job.salary_min.toLocaleString()} ${job.salary_currency}`;
    } else {
      return `до ${job.salary_max!.toLocaleString()} ${job.salary_currency}`;
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Job) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getJobTypeLabel(record.job_type)} • {getExperienceLabel(record.experience_level)}
          </Text>
        </div>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      )
    },
    {
      title: 'Локация',
      dataIndex: 'location',
      key: 'location',
      render: (location: string, record: Job) => (
        <Space>
          {record.is_remote ? (
            <Tag color="green">Удаленно</Tag>
          ) : (
            <Text>{location || 'Не указана'}</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Зарплата',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_, record: Job) => (
        <Text>{formatSalary(record)}</Text>
      )
    },
    {
      title: 'Кандидаты',
      dataIndex: 'candidates_count',
      key: 'candidates',
      render: (count: number, record: Job) => (
        <Space>
          <TeamOutlined />
          <Text>{count || 0} / {record.max_candidates}</Text>
        </Space>
      )
    },
    {
      title: 'Создана',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString('ru-RU')}</Text>
        </Space>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Job) => {
        const menuItems: any[] = [
          {
            key: 'view',
            label: 'Просмотреть',
            icon: <EyeOutlined />,
            onClick: () => navigate(`/company/jobs/${record.id}`)
          },
          {
            key: 'edit',
            label: 'Редактировать',
            icon: <EditOutlined />,
            onClick: () => setEditingJob(record)
          },
          { type: 'divider' as const },
          ...(record.status === 'draft' ? [{
            key: 'activate',
            label: 'Активировать',
            icon: <PlayCircleOutlined />,
            onClick: () => handleStatusChange(record.id, 'active')
          }] : []),
          ...(record.status === 'active' ? [{
            key: 'pause',
            label: 'Приостановить',
            icon: <PauseCircleOutlined />,
            onClick: () => handleStatusChange(record.id, 'paused')
          }] : []),
          ...(record.status === 'paused' ? [{
            key: 'resume',
            label: 'Возобновить',
            icon: <PlayCircleOutlined />,
            onClick: () => handleStatusChange(record.id, 'active')
          }] : []),
          ...(record.status !== 'closed' ? [{
            key: 'close',
            label: 'Закрыть',
            icon: <StopOutlined />,
            onClick: () => handleStatusChange(record.id, 'closed')
          }] : []),
          { type: 'divider' as const },
          {
            key: 'delete',
            label: 'Удалить',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteJob(record)
          }
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      }
    }
  ];

  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const totalCandidates = jobs.reduce((sum, job) => sum + (job.candidates_count || 0), 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/company/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}
            >
              Назад
            </Button>
            <Title level={2} style={{ margin: 0, color: 'rgba(255, 255, 255, 0.95)' }}>
              Управление вакансиями
            </Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              color: '#1a1a2e',
              fontWeight: 600
            }}
          >
            Создать вакансию
          </Button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div style={{ marginBottom: 24 }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Создавайте и управляйте вакансиями для поиска талантливых кандидатов
          </Text>
        </div>

        {/* Статистика */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card className="dashboard-content">
              <Statistic
                title="Всего вакансий"
                value={jobs.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: 'rgba(255, 255, 255, 0.95)' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="dashboard-content">
              <Statistic
                title="Активные вакансии"
                value={activeJobs}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="dashboard-content">
              <Statistic
                title="Всего кандидатов"
                value={totalCandidates}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="dashboard-content">
              <Statistic
                title="Черновики"
                value={jobs.filter(job => job.status === 'draft').length}
                prefix={<EditOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Таблица вакансий */}
        <Card className="dashboard-content">
          <Table
            columns={columns}
            dataSource={jobs}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} из ${total} вакансий`
            }}
            locale={{
              emptyText: 'У вас пока нет вакансий. Создайте первую вакансию, чтобы начать поиск кандидатов.'
            }}
          />
        </Card>
      </div>

      {/* Модальное окно создания/редактирования вакансии */}
      <CreateJobModal
        visible={createModalVisible || !!editingJob}
        onClose={() => {
          setCreateModalVisible(false);
          setEditingJob(null);
        }}
        onSuccess={() => {
          loadJobs();
          setCreateModalVisible(false);
          setEditingJob(null);
        }}
        jobData={editingJob}
      />
    </div>
  );
};

export default JobManagement;
