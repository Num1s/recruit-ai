import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Spin,
  Alert,
  Descriptions,
  List,
  Avatar,
  Breadcrumb
} from 'antd';
import {
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';

const { Title, Text, Paragraph } = Typography;

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
    description?: string;
    logo?: string;
    website?: string;
    size?: string;
  };
}

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getJob(jobId!);
      setJob(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки вакансии:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить информацию о вакансии'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJob = async () => {
    try {
      setApplying(true);
      
      // Отправляем отклик на вакансию
      await authAPI.applyToJob(jobId!);
      
      showSuccess({
        title: 'Заявка подана',
        message: 'Ваша заявка на вакансию успешно отправлена. Компания рассмотрит её в ближайшее время.'
      });
    } catch (error: any) {
      console.error('Ошибка подачи заявки:', error);
      
      let errorMessage = 'Не удалось подать заявку на вакансию';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      showError({
        title: 'Ошибка',
        message: errorMessage
      });
    } finally {
      setApplying(false);
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

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загружаем информацию о вакансии...</Text>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Alert
          message="Вакансия не найдена"
          description="Запрашиваемая вакансия не существует или была удалена"
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          style={{ marginTop: 16 }}
          onClick={() => navigate('/candidate/jobs')}
        >
          Вернуться к списку вакансий
        </Button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="job-details-header">
        <div className="job-details-breadcrumb">
          <Button 
            className="back-button"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/candidate/jobs')}
            size="large"
          >
            Назад к вакансиям
          </Button>
          <div className="breadcrumb-separator">/</div>
          <span className="breadcrumb-current">{job.title}</span>
        </div>
      </div>

      <div className="job-details-content">
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={16}>
            <Card className="job-details-main-card">
              <div className="job-header">
                <div className="job-title-section">
                  <Title level={1} className="job-title">
                    {job.title}
                  </Title>
                  {job.company && (
                    <div className="company-info">
                      <Avatar 
                        size="large" 
                        icon={<UserOutlined />}
                        src={job.company.logo}
                        className="company-avatar"
                      />
                      <div className="company-details">
                        <Text className="company-name">
                          {job.company.name}
                        </Text>
                        {job.company.industry && (
                          <Tag className="company-industry">
                            {job.company.industry}
                          </Tag>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="job-tags">
                <Tag className="experience-tag" color={getExperienceColor(job.experience_level)}>
                  {getExperienceLabel(job.experience_level)}
                </Tag>
                <Tag className="job-type-tag">
                  {getJobTypeLabel(job.job_type)}
                </Tag>
                {job.is_remote && (
                  <Tag className="remote-tag">Удаленно</Tag>
                )}
                {job.is_ai_interview_enabled && (
                  <Tag className="ai-interview-tag" icon={<StarOutlined />}>
                    AI-интервью
                  </Tag>
                )}
              </div>

              <div className="job-meta">
                <Row gutter={[16, 16]}>
                  {job.location && !job.is_remote && (
                    <Col xs={24} sm={12}>
                      <div className="meta-item">
                        <EnvironmentOutlined className="meta-icon" />
                        <div className="meta-content">
                          <Text className="meta-label">Локация</Text>
                          <Text className="meta-value">{job.location}</Text>
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {formatSalary(job) && (
                    <Col xs={24} sm={12}>
                      <div className="meta-item">
                        <DollarOutlined className="meta-icon" />
                        <div className="meta-content">
                          <Text className="meta-label">Зарплата</Text>
                          <Text className="meta-value salary">{formatSalary(job)}</Text>
                        </div>
                      </div>
                    </Col>
                  )}

                  <Col xs={24} sm={12}>
                    <div className="meta-item">
                      <ClockCircleOutlined className="meta-icon" />
                      <div className="meta-content">
                        <Text className="meta-label">Опубликовано</Text>
                        <Text className="meta-value">
                          {new Date(job.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div className="meta-item">
                      <TeamOutlined className="meta-icon" />
                      <div className="meta-content">
                        <Text className="meta-label">Максимум кандидатов</Text>
                        <Text className="meta-value">{job.max_candidates}</Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="job-content">
                <div className="content-section">
                  <Title level={3} className="section-title">Описание</Title>
                  <div className="section-content">
                    <Paragraph className="job-description">
                      {job.description}
                    </Paragraph>
                  </div>
                </div>

                {job.responsibilities && (
                  <div className="content-section">
                    <Title level={3} className="section-title">Обязанности</Title>
                    <div className="section-content">
                      <Paragraph className="job-responsibilities">
                        {job.responsibilities}
                      </Paragraph>
                    </div>
                  </div>
                )}

                {job.requirements && (
                  <div className="content-section">
                    <Title level={3} className="section-title">Требования</Title>
                    <div className="section-content">
                      <Paragraph className="job-requirements">
                        {job.requirements}
                      </Paragraph>
                    </div>
                  </div>
                )}

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="content-section">
                    <Title level={3} className="section-title">Обязательные навыки</Title>
                    <div className="skills-container">
                      {job.required_skills.map((skill, index) => (
                        <Tag key={index} className="required-skill">
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 && (
                  <div className="content-section">
                    <Title level={3} className="section-title">Желательные навыки</Title>
                    <div className="skills-container">
                      {job.nice_to_have_skills.map((skill, index) => (
                        <Tag key={index} className="nice-to-have-skill">
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card className="company-info-card">
              {job.company ? (
                <div>
                  <div className="company-card-header">
                    <Avatar 
                      size={80} 
                      icon={<UserOutlined />}
                      src={job.company.logo}
                      className="company-logo"
                    />
                    <div className="company-card-info">
                      <Title level={3} className="company-card-name">
                        {job.company.name}
                      </Title>
                      {job.company.industry && (
                        <Tag className="company-card-industry">
                          {job.company.industry}
                        </Tag>
                      )}
                    </div>
                  </div>

                  {job.company.description && (
                    <Paragraph ellipsis={{ rows: 3 }}>
                      {job.company.description}
                    </Paragraph>
                  )}

                  <div className="company-details">
                    {job.company.size && (
                      <div className="company-detail-item">
                        <Text className="detail-label">Размер</Text>
                        <Text className="detail-value">{job.company.size} сотрудников</Text>
                      </div>
                    )}
                    {job.company.website && (
                      <div className="company-detail-item">
                        <Text className="detail-label">Сайт</Text>
                        <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="company-website">
                          {job.company.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="company-details-button"
                    onClick={() => navigate(`/candidate/companies/${job.company_id}`)}
                  >
                    Подробнее о компании
                  </Button>
                </div>
              ) : (
                <Text className="no-company-info">Информация о компании недоступна</Text>
              )}
            </Card>

            <Card className="apply-card">
              <div className="apply-section">
                <Title level={3} className="apply-title">Подать заявку</Title>
                <Paragraph className="apply-description">
                  Отправьте свою заявку на эту вакансию. Компания рассмотрит ваше резюме и свяжется с вами.
                </Paragraph>
                
                {job.is_ai_interview_enabled && (
                  <div className="ai-interview-notice">
                    <StarOutlined className="ai-icon" />
                    <div className="ai-content">
                      <Text className="ai-title">AI-интервью включено</Text>
                      <Text className="ai-description">После подачи заявки вы сможете пройти автоматическое AI-интервью</Text>
                    </div>
                  </div>
                )}

                <Button
                  className="apply-job-button"
                  size="large"
                  icon={<SendOutlined />}
                  loading={applying}
                  onClick={handleApplyToJob}
                >
                  {applying ? 'Отправляем заявку...' : 'Откликнуться на вакансию'}
                </Button>

                <div className="apply-note">
                  <CheckCircleOutlined className="note-icon" />
                  <Text className="note-text">Ваша заявка будет отправлена компании</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default JobDetails;
