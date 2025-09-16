import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Tabs,
  Progress,
  Statistic,
  List,
  Badge
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CalendarOutlined,
  TrophyOutlined,
  StarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CompanyData {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  founded: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  benefits: string[];
  culture: string;
  mission: string;
  values: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    averageRating: number;
    activeJobs: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'interview' | 'job_posted' | 'candidate_hired';
    description: string;
    timestamp: string;
  }>;
}

const CompanyProfile: React.FC = () => {
  const [form] = Form.useForm();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      // Моковые данные компании
      const mockCompanyData: CompanyData = {
        id: '1',
        name: 'TechCorp Solutions',
        description: 'Инновационная IT-компания, специализирующаяся на разработке современных веб-приложений и мобильных решений.',
        industry: 'Информационные технологии',
        size: '50-200',
        founded: '2018',
        website: 'https://techcorp.com',
        email: 'contact@techcorp.com',
        phone: '+7 (495) 123-45-67',
        address: 'Москва, ул. Тверская, д. 1, оф. 100',
        benefits: [
          'Гибкий график работы',
          'Медицинская страховка',
          'Обучение и развитие',
          'Удаленная работа',
          'Корпоративные мероприятия',
          'Спортивная компенсация'
        ],
        culture: 'Мы создаем открытую и дружелюбную рабочую среду, где каждый сотрудник может проявить свои таланты и расти профессионально.',
        mission: 'Создавать инновационные технологические решения, которые делают жизнь людей лучше и проще.',
        values: ['Инновации', 'Качество', 'Командная работа', 'Развитие', 'Честность'],
        socialLinks: {
          linkedin: 'https://linkedin.com/company/techcorp',
          twitter: 'https://twitter.com/techcorp',
          facebook: 'https://facebook.com/techcorp'
        },
        stats: {
          totalInterviews: 245,
          completedInterviews: 187,
          averageRating: 4.2,
          activeJobs: 12
        },
        recentActivity: [
          {
            id: '1',
            type: 'interview',
            description: 'Проведено интервью с кандидатом на позицию Frontend Developer',
            timestamp: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            type: 'job_posted',
            description: 'Опубликована новая вакансия: Senior Backend Developer',
            timestamp: '2024-01-14T15:20:00Z'
          },
          {
            id: '3',
            type: 'candidate_hired',
            description: 'Принят новый сотрудник: UI/UX Designer',
            timestamp: '2024-01-13T09:15:00Z'
          }
        ]
      };

      setCompanyData(mockCompanyData);
      form.setFieldsValue(mockCompanyData);
      setLoading(false);
      
    } catch (error) {
      console.error('Ошибка загрузки данных компании:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить данные компании'
      });
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      // Здесь будет API вызов для сохранения данных
      console.log('Сохранение данных:', values);
      
      setCompanyData({ ...companyData!, ...values });
      setEditing(false);
      setLoading(false);
      
      showSuccess({
        title: 'Данные сохранены',
        message: 'Профиль компании успешно обновлен'
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      showError({
        title: 'Ошибка сохранения',
        message: 'Не удалось сохранить изменения'
      });
      setLoading(false);
    }
  };

  const handleUpload = (info: any) => {
    if (info.file.status === 'done') {
      showSuccess({
        title: 'Логотип загружен',
        message: 'Логотип компании успешно обновлен'
      });
    } else if (info.file.status === 'error') {
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить логотип'
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return <EyeOutlined style={{ color: '#1890ff' }} />;
      case 'job_posted':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'candidate_hired':
        return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      default:
        return <StarOutlined />;
    }
  };

  const renderOverview = () => (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card className="profile-card" style={{ marginBottom: 24 }}>
            <div className="profile-header">
              <div className="profile-avatar-section">
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  src={companyData?.logo}
                  className="profile-avatar"
                />
                {editing && (
                  <Upload
                    name="logo"
                    showUploadList={false}
                    onChange={handleUpload}
                    className="avatar-upload"
                  >
                    <Button icon={<UploadOutlined />} size="small">
                      Загрузить
                    </Button>
                  </Upload>
                )}
              </div>
              <div className="profile-info">
                <Title level={2} className="profile-title">
                  {companyData?.name}
                </Title>
                <Text className="profile-industry">{companyData?.industry}</Text>
                <div className="profile-meta">
                  <Tag icon={<TeamOutlined />}>{companyData?.size} сотрудников</Tag>
                  <Tag icon={<CalendarOutlined />}>Основана в {companyData?.founded}</Tag>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <Paragraph className="profile-description">
              {companyData?.description}
            </Paragraph>
            
            <div className="profile-contacts">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><MailOutlined /> {companyData?.email}</div>
                <div><PhoneOutlined /> {companyData?.phone}</div>
                <div><GlobalOutlined /> {companyData?.website}</div>
                <div><EnvironmentOutlined /> {companyData?.address}</div>
              </Space>
            </div>
          </Card>

          <Card title="Миссия и ценности" className="profile-card">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Миссия</Title>
              <Paragraph>{companyData?.mission}</Paragraph>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Корпоративная культура</Title>
              <Paragraph>{companyData?.culture}</Paragraph>
            </div>
            
            <div>
              <Title level={4}>Наши ценности</Title>
              <Space wrap>
                {companyData?.values.map((value, index) => (
                  <Tag key={index} color="blue" className="value-tag">
                    {value}
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Статистика" className="profile-card" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Всего интервью"
                  value={companyData?.stats.totalInterviews}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Завершено"
                  value={companyData?.stats.completedInterviews}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Рейтинг"
                  value={companyData?.stats.averageRating}
                  precision={1}
                  suffix="/ 5"
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Активные вакансии"
                  value={companyData?.stats.activeJobs}
                  prefix={<TeamOutlined />}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Преимущества" className="profile-card" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {companyData?.benefits.map((benefit, index) => (
                <Tag key={index} color="green" className="benefit-tag">
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  {benefit}
                </Tag>
              ))}
            </Space>
          </Card>

          <Card title="Последняя активность" className="profile-card">
            <List
              dataSource={companyData?.recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getActivityIcon(item.type)}
                    title={item.description}
                    description={new Date(item.timestamp).toLocaleDateString('ru-RU')}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderEditForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      initialValues={companyData}
    >
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Название компании"
            rules={[{ required: true, message: 'Введите название компании' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="industry"
            label="Отрасль"
            rules={[{ required: true, message: 'Выберите отрасль' }]}
          >
            <Select>
              <Option value="Информационные технологии">Информационные технологии</Option>
              <Option value="Финансы">Финансы</Option>
              <Option value="Здравоохранение">Здравоохранение</Option>
              <Option value="Образование">Образование</Option>
              <Option value="Розничная торговля">Розничная торговля</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="Описание компании"
        rules={[{ required: true, message: 'Введите описание компании' }]}
      >
        <TextArea rows={4} />
      </Form.Item>

      <Row gutter={24}>
        <Col span={8}>
          <Form.Item name="size" label="Размер компании">
            <Select>
              <Option value="1-10">1-10 сотрудников</Option>
              <Option value="11-50">11-50 сотрудников</Option>
              <Option value="51-200">51-200 сотрудников</Option>
              <Option value="201-1000">201-1000 сотрудников</Option>
              <Option value="1000+">1000+ сотрудников</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="founded" label="Год основания">
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="website" label="Веб-сайт">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="phone" label="Телефон">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="address" label="Адрес">
        <Input />
      </Form.Item>

      <Form.Item name="mission" label="Миссия компании">
        <TextArea rows={3} />
      </Form.Item>

      <Form.Item name="culture" label="Корпоративная культура">
        <TextArea rows={3} />
      </Form.Item>

      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button onClick={() => setEditing(false)}>
            Отмена
          </Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Сохранить
          </Button>
        </Space>
      </div>
    </Form>
  );

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header-section">
          <div className="profile-hero">
            <Title level={2} className="profile-page-title">
              Загрузка профиля...
            </Title>
          </div>
        </div>
        <div className="profile-content">
          <Card className="profile-tabs-card" loading />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div className="profile-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/company/dashboard')}
              className="profile-back-button"
            >
              Назад
            </Button>
            <Title level={2} className="profile-page-title" style={{ margin: 0 }}>
              Профиль компании
            </Title>
          </div>
          <div className="profile-actions">
            <Button
              type="primary"
              icon={editing ? <SaveOutlined /> : <EditOutlined />}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Сохранить' : 'Редактировать'}
            </Button>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <Card className="profile-tabs-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="profile-tabs"
            items={[
              {
                key: 'overview',
                label: 'Обзор',
                icon: <UserOutlined />,
                children: editing ? renderEditForm() : renderOverview(),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default CompanyProfile;
