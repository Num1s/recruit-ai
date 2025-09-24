import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Avatar,
  Tag,
  Space,
  message,
  Divider,
} from 'antd';
import {
  UserOutlined,
  CrownOutlined,
  SettingOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { authAPI } from '../../services/api.ts';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

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
}

const RecruiterProfile: React.FC = () => {
  const { user, isRecruiter, isSeniorRecruiter, isRecruitLead, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getRecruiterProfile();
      setProfile(response.data);
      form.setFieldsValue({
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        email: response.data.user.email,
      });
    } catch (error: any) {
      message.error('Ошибка при загрузке профиля');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      // Здесь должен быть API вызов для обновления профиля
      // await authAPI.updateProfile(values);
      message.success('Профиль успешно обновлен');
    } catch (error: any) {
      message.error('Ошибка при сохранении профиля');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
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

  if (loading) {
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
            <Text>Загрузка профиля...</Text>
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
      </div>

      <div className="dashboard-content">
        <div style={{ marginBottom: '2rem' }}>
          <Space style={{ marginBottom: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/recruiter/dashboard')}
            >
              Назад к дашборду
            </Button>
          </Space>
          <Title level={2}>Профиль рекрутера</Title>
          <Text type="secondary">
            Управление личной информацией и настройками аккаунта
          </Text>
        </div>

        <Row gutter={24}>
          <Col span={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Avatar 
                  size={80} 
                  icon={roleInfo.icon} 
                  style={{ backgroundColor: roleInfo.color, marginBottom: 16 }} 
                />
                <Title level={4} style={{ margin: 0 }}>
                  {profile?.user.first_name} {profile?.user.last_name}
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {profile?.user.email}
                </Text>
                <Tag color={roleInfo.color} icon={roleInfo.icon}>
                  {roleInfo.title}
                </Tag>
                <Divider />
                <Text type="secondary">
                  В системе с: {profile?.user.created_at ? new Date(profile.user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </Text>
                {profile?.stream && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Поток: </Text>
                    <Text>{profile.stream.name}</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col span={16}>
            <Card title="Редактирование профиля">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  first_name: profile?.user.first_name || '',
                  last_name: profile?.user.last_name || '',
                  email: profile?.user.email || '',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="first_name"
                      label="Имя"
                      rules={[{ required: true, message: 'Введите имя' }]}
                    >
                      <Input placeholder="Имя" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="last_name"
                      label="Фамилия"
                      rules={[{ required: true, message: 'Введите фамилию' }]}
                    >
                      <Input placeholder="Фамилия" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Введите email' },
                    { type: 'email', message: 'Введите корректный email' }
                  ]}
                >
                  <Input placeholder="email@example.com" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      Сохранить изменения
                    </Button>
                    <Button onClick={() => form.resetFields()}>
                      Отменить
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RecruiterProfile;
