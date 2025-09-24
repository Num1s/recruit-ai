import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Empty,
  Dropdown,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  FileTextOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import StreamManagement from '../../components/recruiter/StreamManagement.tsx';
import UserManagement from '../../components/recruiter/UserManagement.tsx';
import Analytics from '../../components/recruiter/Analytics.tsx';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface RecruiterProfile {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };
  stream?: {
    id: number;
    name: string;
    senior_recruiter?: {
      id: number;
      name: string;
      email: string;
    };
  };
  owned_stream?: {
    id: number;
    name: string;
    recruiters_count: number;
    recruiters: Array<{
      id: number;
      name: string;
      email: string;
    }>;
  };
  supervised_streams?: Array<{
    id: number;
    name: string;
    senior_recruiter?: {
      id: number;
      name: string;
      email: string;
    };
    recruiters_count: number;
    recruiters: Array<{
      id: number;
      name: string;
      email: string;
    }>;
  }>;
}

const RecruiterDashboard: React.FC = () => {
  const { user, isRecruiter, isSeniorRecruiter, isRecruitLead, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && (isRecruiter || isSeniorRecruiter || isRecruitLead || isAdmin)) {
      fetchRecruiterProfile();
    }
  }, [user]);

  const fetchRecruiterProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getRecruiterProfile();
      setProfile(response.data);
    } catch (error: any) {
      console.error('Error fetching recruiter profile:', error);
      setError('Ошибка при загрузке профиля. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'recruiter':
        return {
          title: 'Рекрутер',
          icon: <UserOutlined style={{ color: '#1890ff' }} />,
          color: 'blue',
        };
      case 'senior_recruiter':
        return {
          title: 'Старший рекрутер',
          icon: <CrownOutlined style={{ color: '#fa8c16' }} />,
          color: 'orange',
        };
      case 'recruit_lead':
        return {
          title: 'Главный рекрутер',
          icon: <CrownOutlined style={{ color: '#ff4d4f' }} />,
          color: 'red',
        };
      case 'admin':
        return {
          title: 'Администратор',
          icon: <SettingOutlined style={{ color: '#722ed1' }} />,
          color: 'purple',
        };
      default:
        return {
          title: 'Пользователь',
          icon: <UserOutlined />,
          color: 'default',
        };
    }
  };

  const roleInfo = getRoleInfo();

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        navigate('/recruiter/profile');
        break;
      case 'settings':
        navigate('/recruiter/settings');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  const renderOverviewTab = () => {
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Empty 
            description={error}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={fetchRecruiterProfile}>
              Попробовать снова
            </Button>
          </Empty>
        </div>
      );
    }
    
    if (!profile) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Empty 
            description="Загрузка профиля..." 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <div>
        {/* User Info Card */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Avatar size={64} icon={roleInfo.icon} style={{ backgroundColor: roleInfo.color }} />
            </Col>
            <Col flex={1}>
              <Title level={3} style={{ margin: 0, color: '#1f1f1f' }}>
                {profile.user.first_name} {profile.user.last_name}
              </Title>
              <Text type="secondary" style={{ color: '#666' }}>{profile.user.email}</Text>
              <br />
              <Tag color={roleInfo.color} icon={roleInfo.icon} style={{ marginTop: 8 }}>
                {roleInfo.title}
              </Tag>
            </Col>
            <Col>
              <Text type="secondary" style={{ color: '#666' }}>
                В системе с: {new Date(profile.user.created_at).toLocaleDateString('ru-RU')}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {isRecruiter && profile.stream && (
            <Col span={8}>
              <Card>
                <Statistic
                  title="Мой поток"
                  value={profile.stream.name}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                {profile.stream.senior_recruiter && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    Старший рекрутер: {profile.stream.senior_recruiter.name}
                  </div>
                )}
              </Card>
            </Col>
          )}
          
          {isRecruiter && !profile.stream && (
            <Col span={8}>
              <Card>
                <Statistic
                  title="Мой поток"
                  value="Не назначен"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Обратитесь к администратору
                </div>
              </Card>
            </Col>
          )}

          {isSeniorRecruiter && profile.owned_stream && (
            <>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Мой поток"
                    value={profile.owned_stream.name}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Рекрутеров в потоке"
                    value={profile.owned_stream.recruiters_count}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </>
          )}

          {isRecruitLead && profile.supervised_streams && (
            <>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Всего потоков"
                    value={profile.supervised_streams.length}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Всего рекрутеров"
                    value={profile.supervised_streams.reduce((sum, stream) => sum + stream.recruiters_count, 0)}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Старших рекрутеров"
                    value={profile.supervised_streams.filter(s => s.senior_recruiter).length}
                    prefix={<CrownOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>

        {/* Stream Details */}
        {isRecruiter && profile.stream && (
          <Card title="Информация о потоке" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#1f1f1f' }}>Название потока:</Text>
                  <br />
                  <Text style={{ color: '#1f1f1f' }}>{profile.stream.name}</Text>
                </div>
              </Col>
              {profile.stream.senior_recruiter && (
                <Col span={12}>
                  <div>
                    <Text strong style={{ color: '#1f1f1f' }}>Старший рекрутер:</Text>
                    <br />
                    <Text style={{ color: '#1f1f1f' }}>{profile.stream.senior_recruiter.name}</Text>
                    <br />
                    <Text type="secondary" style={{ color: '#666' }}>{profile.stream.senior_recruiter.email}</Text>
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        )}

        {/* Owned Stream Details */}
        {isSeniorRecruiter && profile.owned_stream && (
          <Card title="Мой поток" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#1f1f1f' }}>Название потока:</Text>
                  <br />
                  <Text style={{ color: '#1f1f1f' }}>{profile.owned_stream.name}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#1f1f1f' }}>Количество рекрутеров:</Text>
                  <br />
                  <Text style={{ color: '#1f1f1f' }}>{profile.owned_stream.recruiters_count}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Recruiters List */}
        {isSeniorRecruiter && profile.owned_stream && profile.owned_stream.recruiters.length > 0 && (
          <Card title="Рекрутеры в моем потоке">
            <List
              dataSource={profile.owned_stream.recruiters}
              renderItem={(recruiter) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={recruiter.name}
                    description={recruiter.email}
                  />
                  <Tag color="blue">Рекрутер</Tag>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Supervised Streams */}
        {isRecruitLead && profile.supervised_streams && profile.supervised_streams.length > 0 && (
          <Card title="Все потоки">
            <List
              dataSource={profile.supervised_streams}
              renderItem={(stream) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small">
                      Подробнее
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<TeamOutlined />} />}
                    title={stream.name}
                    description={
                      <Space>
                        <Text type="secondary">
                          Старший: {stream.senior_recruiter?.name || 'Не назначен'}
                        </Text>
                        <Tag color="blue">
                          {stream.recruiters_count} рекрутеров
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>
    );
  };

  const renderStreamsTab = () => {
    if (!isSeniorRecruiter && !isRecruitLead) {
      return <Empty description="У вас нет доступа к управлению потоками" />;
    }
    return <StreamManagement />;
  };

  const renderUsersTab = () => {
    if (!isAdmin && !isRecruitLead) {
      return <Empty description="У вас нет доступа к управлению пользователями" />;
    }
    return <UserManagement />;
  };

  const renderAnalyticsTab = () => {
    return <Analytics />;
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Обзор',
      children: renderOverviewTab(),
    },
  ];

  if (isSeniorRecruiter || isRecruitLead) {
    tabItems.push({
      key: 'streams',
      label: 'Потоки',
      children: renderStreamsTab(),
    });
  }

  if (isAdmin || isRecruitLead) {
    tabItems.push({
      key: 'users',
      label: 'Пользователи',
      children: renderUsersTab(),
    });
  }

  // Аналитика доступна всем ролям рекрутеров
  tabItems.push({
    key: 'analytics',
    label: 'Аналитика',
    children: renderAnalyticsTab(),
  });

  if (loading && !profile) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Recruit.ai
            </Title>
          </div>
        </div>
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty 
              description="Загрузка..." 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        </div>
      </div>
    );
  }

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
            type="default" 
            icon={<TeamOutlined />}
            onClick={() => setActiveTab('streams')}
          >
            Потоки
          </Button>
          <Button 
            type="default" 
            icon={<UserOutlined />}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </Button>
          <Button 
            type="default" 
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab('analytics')}
          >
            Аналитика
          </Button>
          <Button 
            type="default" 
            icon={<SearchOutlined />}
            onClick={() => navigate('/recruiter/candidates')}
          >
            Поиск кандидатов
          </Button>
          <Button 
            type="default" 
            icon={<UserSwitchOutlined />}
            onClick={() => navigate('/recruiter/candidates-in-process')}
          >
            Кандидаты в отборе
          </Button>
          <Button 
            type="default" 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/recruiter/interview-reports')}
          >
            Отчеты по интервью
          </Button>
          <Dropdown 
            menu={{ 
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: 'Профиль',
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
              ],
              onClick: ({ key }) => handleMenuClick(key)
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={roleInfo.icon} style={{ backgroundColor: roleInfo.color }} />
              <span>{user?.first_name} {user?.last_name}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>

      <div className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <Title level={2}>
            Панель рекрутера
          </Title>
          <Text type="secondary">
            Управление потоками рекрутинга, пользователями и аналитикой
          </Text>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Card>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
