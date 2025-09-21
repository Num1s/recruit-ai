import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tabs, Button, Table, Modal, Form, Input, Select, message, Tag, Popconfirm, Space, Statistic } from 'antd';
import { PlusOutlined, UserAddOutlined, DeleteOutlined, TeamOutlined, CrownOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Простой API клиент
const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен авторизации (если есть)
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Обновляем токен перед каждым запросом
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Загружаем участников команды при монтировании компонента
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/recruiters');
      const teamMembers = response.data.map((user: any) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        created_at: new Date(user.created_at).toLocaleDateString('ru-RU')
      }));
      setMembers(teamMembers);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      // Если ошибка авторизации, показываем моковые данные
      if (error.response?.status === 401) {
        const mockMembers: TeamMember[] = [
          {
            id: 1,
            name: 'Анна Петрова',
            email: 'anna@techcorp.com',
            role: 'HR Manager',
            created_at: '15.01.2024'
          },
          {
            id: 2,
            name: 'Михаил Сидоров',
            email: 'mikhail@techcorp.com',
            role: 'Tech Lead',
            created_at: '14.01.2024'
          }
        ];
        setMembers(mockMembers);
        message.warning('Используются демо-данные. Войдите в систему для полной функциональности.');
      } else {
        message.error('Ошибка при загрузке участников команды');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (values: any) => {
    try {
      console.log('Creating user:', values);
      
      const response = await apiClient.post('/users/', {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        role: values.role,
        stream_id: values.stream_id
      });

      // Перезагружаем список участников
      await loadTeamMembers();
      
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('Участник команды успешно добавлен! Теперь он может войти в систему используя указанные email и пароль.');
    } catch (error: any) {
      console.error('Error creating team member:', error);
      if (error.response?.status === 401) {
        message.error('Необходимо войти в систему для создания пользователей');
      } else {
        message.error(error.response?.data?.detail || 'Ошибка при создании участника команды');
      }
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await apiClient.delete(`/users/${id}`);
      // Перезагружаем список участников
      await loadTeamMembers();
      message.success('Участник команды удален');
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      if (error.response?.status === 401) {
        message.error('Необходимо войти в систему для удаления пользователей');
      } else {
        message.error(error.response?.data?.detail || 'Ошибка при удалении участника');
      }
    }
  };

  const memberColumns = [
    {
      title: 'Участник',
      key: 'member',
      render: (record: TeamMember) => (
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
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Добавлен',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: TeamMember) => (
        <Space>
          <Popconfirm
            title="Вы уверены, что хотите удалить этого участника?"
            onConfirm={() => handleDeleteMember(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Всего участников"
              value={members.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Активных ролей"
              value={3}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Рекрутеров"
              value={members.filter(m => m.role.includes('Recruiter')).length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Участники команды"
        extra={
          <Space>
            <Button
              onClick={async () => {
                try {
                  const response = await apiClient.get('/users/recruiters');
                  console.log('API Response:', response.data);
                  message.success('API работает! Проверьте консоль для деталей.');
                } catch (error: any) {
                  console.error('API Error:', error);
                  message.error(`API ошибка: ${error.response?.data?.message || error.message}`);
                }
              }}
            >
              Тест API
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
            >
              Пригласить участника
            </Button>
          </Space>
        }
      >
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loading}
        />
      </Card>

      {/* Модальное окно создания участника */}
      <Modal
        title="Пригласить участника команды"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateMember}
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

          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' }
            ]}
          >
            <Input.Password placeholder="Пароль для входа" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select placeholder="Выберите роль">
              <Option value="recruit_lead">Recruit Lead</Option>
              <Option value="senior_recruiter">Senior Recruiter</Option>
              <Option value="recruiter">Recruiter</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="stream_id"
            label="Поток (только для рекрутеров)"
            dependencies={['role']}
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const role = getFieldValue('role');
                  if ((role === 'recruiter' || role === 'RECRUITER') && !value) {
                    return Promise.reject(new Error('Для рекрутера необходимо выбрать поток'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              if (role === 'recruiter' || role === 'RECRUITER') {
                return (
                  <Select placeholder="Выберите поток (обязательно для рекрутеров)">
                    <Option value={1}>Frontend-направление</Option>
                    <Option value={2}>Backend-направление</Option>
                    <Option value={3}>DevOps-направление</Option>
                  </Select>
                );
              }
              return (
                <div style={{ color: '#999', fontStyle: 'italic' }}>
                  Поток не нужен для руководителей
                </div>
              );
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                Создать участника
              </Button>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                form.resetFields();
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamManagement;
