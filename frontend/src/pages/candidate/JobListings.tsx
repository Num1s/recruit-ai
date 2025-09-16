import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Pagination,
  Empty,
  Spin,
  Divider,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarOutlined,
  FilterOutlined,
  EyeOutlined,
  SendOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  job_type: string;
  experience_level: string;
  location?: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  status: string;
  is_ai_interview_enabled: boolean;
  max_candidates: number;
  created_at: string;
  company_id: number;
  company?: {
    name: string;
    industry: string;
    logo?: string;
  };
}

const JobListings: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    loadJobs();
  }, [currentPage, searchText, selectedExperience, selectedJobType, selectedLocation]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        status: 'active'
      };

      if (searchText) {
        params.search = searchText;
      }
      if (selectedExperience) {
        params.experience_level = selectedExperience;
      }
      if (selectedJobType) {
        params.job_type = selectedJobType;
      }
      if (selectedLocation) {
        params.location = selectedLocation;
      }

      const response = await authAPI.getJobs(params);
      setJobs(response.data);
      setTotalJobs(response.data.length); // В реальном API здесь будет общее количество
      
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

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'experience':
        setSelectedExperience(value);
        break;
      case 'jobType':
        setSelectedJobType(value);
        break;
      case 'location':
        setSelectedLocation(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleApplyToJob = async (jobId: number) => {
    try {
      // Здесь будет логика подачи заявки на вакансию
      showSuccess({
        title: 'Заявка подана',
        message: 'Ваша заявка на вакансию успешно отправлена'
      });
    } catch (error: any) {
      console.error('Ошибка подачи заявки:', error);
      showError({
        title: 'Ошибка',
        message: 'Не удалось подать заявку на вакансию'
      });
    }
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

  const getExperienceColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'intern': 'blue',
      'junior': 'green',
      'middle': 'orange',
      'senior': 'red',
      'lead': 'purple',
      'principal': 'gold'
    };
    return colors[level] || 'default';
  };

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return null;
    
    if (job.salary_min && job.salary_max) {
      return `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency}`;
    } else if (job.salary_min) {
      return `от ${job.salary_min.toLocaleString()} ${job.salary_currency}`;
    } else {
      return `до ${job.salary_max!.toLocaleString()} ${job.salary_currency}`;
    }
  };

  const renderJobCard = (job: Job) => (
    <Card
      key={job.id}
      hoverable
      className="job-card"
      style={{ height: '100%' }}
      actions={[
        <Tooltip title="Подробнее о вакансии">
          <Button 
            className="details-button"
            type="text" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/candidate/jobs/${job.id}`)}
          >
            Подробнее
          </Button>
        </Tooltip>,
        <Button 
          className="apply-button"
          type="primary" 
          icon={<SendOutlined />}
          onClick={() => handleApplyToJob(job.id)}
        >
          Откликнуться
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
          {job.title}
        </Title>
        {job.company && (
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {job.company.name}
          </Text>
        )}
      </div>

      <Paragraph 
        ellipsis={{ rows: 3, expandable: false }}
        style={{ marginBottom: 16, minHeight: '60px' }}
      >
        {job.description}
      </Paragraph>

      <Space wrap style={{ marginBottom: 16 }}>
        <Tag color={getExperienceColor(job.experience_level)}>
          {getExperienceLabel(job.experience_level)}
        </Tag>
        <Tag color="blue">
          {getJobTypeLabel(job.job_type)}
        </Tag>
        {job.is_remote && (
          <Tag color="green">Удаленно</Tag>
        )}
        {job.is_ai_interview_enabled && (
          <Tag color="purple" icon={<StarOutlined />}>
            AI-интервью
          </Tag>
        )}
      </Space>

      <Divider style={{ margin: '12px 0' }} />

      <Row gutter={[8, 8]}>
        {job.location && !job.is_remote && (
          <Col span={24}>
            <Space>
              <EnvironmentOutlined style={{ color: '#1890ff' }} />
              <Text>{job.location}</Text>
            </Space>
          </Col>
        )}
        
        {formatSalary(job) && (
          <Col span={24}>
            <Space>
              <DollarOutlined style={{ color: '#52c41a' }} />
              <Text strong>{formatSalary(job)}</Text>
            </Space>
          </Col>
        )}

        <Col span={24}>
          <Space>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <Text type="secondary">
              Опубликовано {new Date(job.created_at).toLocaleDateString('ru-RU')}
            </Text>
          </Space>
        </Col>
      </Row>

      {job.required_skills && job.required_skills.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Text strong style={{ fontSize: '12px' }}>Ключевые навыки:</Text>
          <div style={{ marginTop: 4 }}>
            <Space wrap>
              {job.required_skills.slice(0, 3).map((skill, index) => (
                <Tag key={index} color="red">
                  {skill}
                </Tag>
              ))}
              {job.required_skills.length > 3 && (
                <Tag color="default">
                  +{job.required_skills.length - 3}
                </Tag>
              )}
            </Space>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div className="page-header-content">
          <Button
            className="back-button"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/candidate/dashboard')}
            size="large"
          >
            Назад
          </Button>
          <div className="page-title-section">
            <Title level={2} className="page-title">Вакансии</Title>
            <Text className="page-subtitle">
              Найдите подходящую работу в IT и финтехе
            </Text>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="search-panel">
        <div className="search-panel-content">
          {/* Поисковая строка */}
          <div className="search-section">
            <div className="search-wrapper">
              <SearchOutlined className="search-icon" />
              <input
                className="search-field"
                type="text"
                placeholder="Поиск по названию, компании или навыкам..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  if (!e.target.value) {
                    setCurrentPage(1);
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchText)}
              />
              <button
                className="search-button"
                onClick={() => handleSearch(searchText)}
              >
                <SearchOutlined />
              </button>
            </div>
          </div>

          {/* Фильтры */}
          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">Опыт</label>
              <Select
                className="filter-select"
                placeholder="Любой"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={selectedExperience}
                onChange={(value) => handleFilterChange('experience', value || '')}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="intern">Стажер</Option>
                <Option value="junior">Junior</Option>
                <Option value="middle">Middle</Option>
                <Option value="senior">Senior</Option>
                <Option value="lead">Lead</Option>
                <Option value="principal">Principal</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Тип работы</label>
              <Select
                className="filter-select"
                placeholder="Любой"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={selectedJobType}
                onChange={(value) => handleFilterChange('jobType', value || '')}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="full_time">Полная занятость</Option>
                <Option value="part_time">Частичная занятость</Option>
                <Option value="contract">Контракт</Option>
                <Option value="internship">Стажировка</Option>
              </Select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Локация</label>
              <Select
                className="filter-select"
                placeholder="Любая"
                allowClear
                size="large"
                style={{ width: '100%' }}
                value={selectedLocation}
                onChange={(value) => handleFilterChange('location', value || '')}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="remote">Удаленно</Option>
                <Option value="bishkek">Бишкек</Option>
                <Option value="osh">Ош</Option>
                <Option value="other">Другое</Option>
              </Select>
            </div>

            <div className="filter-actions">
              <Button
                className="clear-filters-button"
                size="large"
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setSelectedExperience('');
                  setSelectedJobType('');
                  setSelectedLocation('');
                  setCurrentPage(1);
                }}
              >
                Очистить
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Результаты поиска */}
      <div className="results-header">
        <Space>
          <Text className="results-count">
            Найдено вакансий: {totalJobs}
          </Text>
          {(searchText || selectedExperience || selectedJobType || selectedLocation) && (
            <Badge count={[searchText, selectedExperience, selectedJobType, selectedLocation].filter(Boolean).length}>
              <Text className="active-filters">Активные фильтры</Text>
            </Badge>
          )}
        </Space>
      </div>

      {/* Список вакансий */}
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <div className="loading-text">
            <Text>Загружаем вакансии...</Text>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <Empty
          className="empty-state"
          description="Вакансии не найдены"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            className="show-all-button"
            type="primary" 
            onClick={() => {
              setSearchText('');
              setSelectedExperience('');
              setSelectedJobType('');
              setSelectedLocation('');
              setCurrentPage(1);
            }}
          >
            Показать все вакансии
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {jobs.map(renderJobCard)}
          </Row>

          {totalJobs > pageSize && (
            <div className="pagination-container">
              <Pagination
                current={currentPage}
                total={totalJobs}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} из ${total} вакансий`
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobListings;
