import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Divider,
  Space,
  Alert,
  Tabs,
  Row,
  Col,
  Checkbox,
  Tag,
  Modal,
  List,
  Avatar,
  Badge,
  Tooltip,
  Slider,
  Progress,
  Table,
  Popconfirm,
  Statistic,
  message
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  NotificationOutlined,
  TeamOutlined,
  GlobalOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  CrownOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api.ts';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}


// Компонент управления командой
const TeamManagementComponent: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreateStreamModalVisible, setIsCreateStreamModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [form] = Form.useForm();
  const [streamForm] = Form.useForm();

  // Загружаем участников команды и потоки при монтировании компонента
  useEffect(() => {
    loadTeamMembers();
    loadStreams();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Отладочная информация
      const token = localStorage.getItem('access_token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      const response = await authAPI.getRecruiters();
      console.log('API Response:', response);
      console.log('API Response data:', response.data);
      
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
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Если ошибка авторизации, показываем моковые данные
      if (error.response?.status === 401 || error.response?.status === 403) {
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

  const loadStreams = async () => {
    try {
      console.log('Loading streams...');
      const response = await authAPI.getStreams();
      console.log('Streams Response:', response);
      console.log('Streams data:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setStreams(response.data);
        console.log('Streams loaded successfully:', response.data);
      } else {
        console.warn('Streams response is not an array:', response.data);
        setStreams([]);
      }
    } catch (error: any) {
      console.error('Error loading streams:', error);
      console.error('Error response:', error.response);
      
      // Если ошибка, используем потоки из базы данных
      const mockStreams = [
        { id: 1, name: 'чап' },
        { id: 2, name: 'gurenidus' }
      ];
      setStreams(mockStreams);
      console.log('Using mock streams:', mockStreams);
    }
  };

  const handleCreateStream = async (values: any) => {
    try {
      console.log('Creating stream:', values);
      
      const response = await authAPI.createStream({
        name: values.name
      });

      // Перезагружаем список потоков
      await loadStreams();
      
      setIsCreateStreamModalVisible(false);
      streamForm.resetFields();
      message.success('Поток успешно создан!');
    } catch (error: any) {
      console.error('Error creating stream:', error);
      message.error(error.response?.data?.detail || 'Ошибка при создании потока');
    }
  };

  const handleCreateMember = async (values: any) => {
    try {
      console.log('Creating user with values:', values);
      
      // Для руководителей (RECRUIT_LEAD, SENIOR_RECRUITER) не передаем stream_id
      const userData: any = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        role: values.role
      };
      
      // Добавляем stream_id только для обычных рекрутеров
      if ((values.role === 'recruiter' || values.role === 'RECRUITER') && values.stream_id) {
        userData.stream_id = values.stream_id;
        console.log('Added stream_id:', values.stream_id);
      } else if (values.role === 'recruiter' || values.role === 'RECRUITER') {
        console.log('Warning: recruiter role selected but no stream_id provided');
      }
      
      console.log('Final userData:', userData);
      const response = await authAPI.createUser(userData);

      // Перезагружаем список участников
      await loadTeamMembers();
      
      setIsCreateModalVisible(false);
      form.resetFields();
      setSelectedRole('');
      message.success('Участник команды успешно добавлен! Теперь он может войти в систему используя указанные email и пароль.');
    } catch (error: any) {
      console.error('Error creating team member:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        message.error('Необходимо войти в систему для создания пользователей');
      } else {
        message.error(error.response?.data?.detail || 'Ошибка при создании участника команды');
      }
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await authAPI.deleteTeamMember(id);
      // Перезагружаем список участников
      await loadTeamMembers();
      message.success('Участник команды удален');
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
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
              title="Потоков"
              value={streams.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Участники команды"
        extra={
          <Space>
            <Button
              onClick={loadStreams}
              title="Перезагрузить потоки"
            >
              🔄 Потоки ({streams.length})
            </Button>
            <Button
              onClick={() => {
                console.log('Form values:', form.getFieldsValue());
                console.log('Form errors:', form.getFieldsError());
              }}
              title="Проверить форму"
            >
              🔍 Форма
            </Button>
            <Button
              onClick={() => setIsCreateStreamModalVisible(true)}
              icon={<PlusOutlined />}
            >
              Создать поток
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
          setSelectedRole('');
        }}
        footer={null}
        width={600}
      >
        {/* Отладочная информация */}
        <div style={{ marginBottom: 16, padding: 8, background: '#f0f0f0', borderRadius: 4, fontSize: '12px' }}>
          <div>Доступных потоков: {streams.length}</div>
          <div>Потоки: {streams.map(s => `${s.id}: ${s.name}`).join(', ')}</div>
          <div>Выбранная роль: {selectedRole}</div>
          <div>Текущие значения формы: {JSON.stringify(form.getFieldsValue())}</div>
        </div>
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
            <Select 
              placeholder="Выберите роль"
              value={selectedRole}
              onChange={(value) => {
                console.log('Role changed to:', value);
                setSelectedRole(value);
                // Очищаем поле потока при смене роли
                form.setFieldsValue({ stream_id: undefined });
              }}
            >
              <Option value="recruit_lead">Recruit Lead</Option>
              <Option value="senior_recruiter">Senior Recruiter</Option>
              <Option value="recruiter">Recruiter</Option>
            </Select>
          </Form.Item>

          {selectedRole === 'recruiter' && (
            <Form.Item
              name="stream_id"
              label="Поток (обязательно для рекрутеров)"
              rules={[
                { required: true, message: 'Для рекрутера необходимо выбрать поток' }
              ]}
            >
              <Select 
                placeholder="Выберите поток"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: '100%' }}
              >
                {streams.map(stream => (
                  <Option key={stream.id} value={stream.id}>
                    {stream.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                Создать участника
              </Button>
              <Button onClick={() => {
                setIsCreateModalVisible(false);
                form.resetFields();
                setSelectedRole('');
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно создания потока */}
      <Modal
        title="Создать новый поток"
        open={isCreateStreamModalVisible}
        onCancel={() => {
          setIsCreateStreamModalVisible(false);
          streamForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={streamForm}
          layout="vertical"
          onFinish={handleCreateStream}
        >
          <Form.Item
            name="name"
            label="Название потока"
            rules={[
              { required: true, message: 'Введите название потока' },
              { min: 2, message: 'Название должно содержать минимум 2 символа' }
            ]}
          >
            <Input placeholder="Например: Frontend-направление" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Создать поток
              </Button>
              <Button onClick={() => {
                setIsCreateStreamModalVisible(false);
                streamForm.resetFields();
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

interface SettingsData {
  general: {
    companyName: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    browserNotifications: boolean;
    interviewReminders: boolean;
    candidateUpdates: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  interview: {
    defaultDuration: number;
    bufferTime: number;
    maxReschedulings: number;
    autoConfirmation: boolean;
    recordingSetting: 'always' | 'ask' | 'never';
    qualityThreshold: number;
    aiAnalysisEnabled: boolean;
    customQuestions: string[];
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    ipWhitelist: string[];
    dataRetention: number;
  };
  team: {
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      permissions: string[];
      lastActive: string;
      status: 'active' | 'inactive';
    }>;
    roles: Array<{
      name: string;
      permissions: string[];
    }>;
  };
  billing: {
    plan: string;
    billingCycle: 'monthly' | 'yearly';
    nextBilling: string;
    usage: {
      interviews: number;
      storage: number;
      users: number;
    };
    limits: {
      interviews: number;
      storage: number;
      users: number;
    };
  };
}

const CompanySettings: React.FC = () => {
  const [form] = Form.useForm();
  const { showSuccess, showError, showWarning } = useNotification();
  const navigate = useNavigate();
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      // Моковые данные настроек
      const mockSettings: SettingsData = {
        general: {
          companyName: 'TechCorp Solutions',
          timezone: 'Europe/Moscow',
          language: 'ru',
          dateFormat: 'DD.MM.YYYY',
          currency: 'RUB'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          browserNotifications: true,
          interviewReminders: true,
          candidateUpdates: true,
          systemAlerts: true,
          weeklyReports: true,
          monthlyReports: false
        },
        interview: {
          defaultDuration: 60,
          bufferTime: 15,
          maxReschedulings: 2,
          autoConfirmation: false,
          recordingSetting: 'ask',
          qualityThreshold: 80,
          aiAnalysisEnabled: true,
          customQuestions: [
            'Расскажите о своем опыте работы с React',
            'Как вы решаете конфликты в команде?',
            'Какие технологии хотели бы изучить?'
          ]
        },
        security: {
          twoFactorAuth: true,
          sessionTimeout: 480,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          },
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
          dataRetention: 365
        },
        team: {
          members: [
            {
              id: '1',
              name: 'Анна Петрова',
              email: 'anna@techcorp.com',
              role: 'HR Manager',
              permissions: ['view_candidates', 'conduct_interviews', 'manage_jobs'],
              lastActive: '2024-01-15T10:30:00Z',
              status: 'active'
            },
            {
              id: '2',
              name: 'Михаил Сидоров',
              email: 'mikhail@techcorp.com',
              role: 'Tech Lead',
              permissions: ['view_candidates', 'conduct_interviews', 'technical_assessment'],
              lastActive: '2024-01-14T16:20:00Z',
              status: 'active'
            }
          ],
          roles: [
            {
              name: 'HR Manager',
              permissions: ['view_candidates', 'conduct_interviews', 'manage_jobs', 'view_reports']
            },
            {
              name: 'Tech Lead',
              permissions: ['view_candidates', 'conduct_interviews', 'technical_assessment']
            },
            {
              name: 'Admin',
              permissions: ['full_access']
            }
          ]
        },
        billing: {
          plan: 'Professional',
          billingCycle: 'monthly',
          nextBilling: '2024-02-15',
          usage: {
            interviews: 87,
            storage: 2.4,
            users: 5
          },
          limits: {
            interviews: 200,
            storage: 10,
            users: 10
          }
        }
      };

      setSettingsData(mockSettings);
      form.setFieldsValue(mockSettings);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить настройки'
      });
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      // Здесь будет API вызов для сохранения настроек
      console.log('Сохранение настроек:', values);
      
      setSettingsData({ ...settingsData!, ...values });
      setSaving(false);
      
      showSuccess({
        title: 'Настройки сохранены',
        message: 'Все изменения успешно применены'
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      showError({
        title: 'Ошибка сохранения',
        message: 'Не удалось сохранить настройки'
      });
      setSaving(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    confirm({
      title: 'Удалить пользователя?',
      content: 'Это действие нельзя отменить. Пользователь потеряет доступ к системе.',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        showSuccess({
          title: 'Пользователь удален',
          message: 'Доступ к системе отозван'
        });
      },
    });
  };

  const renderGeneralSettings = () => (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Card title="Основные настройки" className="settings-card">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name={['general', 'companyName']}
              label="Название компании"
              rules={[{ required: true, message: 'Введите название компании' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['general', 'timezone']}
              label="Часовой пояс"
            >
              <Select>
                <Option value="Europe/Moscow">Москва (UTC+3)</Option>
                <Option value="Europe/London">Лондон (UTC+0)</Option>
                <Option value="America/New_York">Нью-Йорк (UTC-5)</Option>
                <Option value="Asia/Tokyo">Токио (UTC+9)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item name={['general', 'language']} label="Язык интерфейса">
              <Select>
                <Option value="ru">Русский</Option>
                <Option value="en">English</Option>
                <Option value="de">Deutsch</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['general', 'dateFormat']} label="Формат даты">
              <Select>
                <Option value="DD.MM.YYYY">DD.MM.YYYY</Option>
                <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['general', 'currency']} label="Валюта">
              <Select>
                <Option value="RUB">Рубль (₽)</Option>
                <Option value="USD">Доллар ($)</Option>
                <Option value="EUR">Евро (€)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );

  const renderNotificationSettings = () => (
    <div>
      <Card title="Уведомления по email" className="settings-card" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Email уведомления</Text>
              <br />
              <Text type="secondary">Получать уведомления на email</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.emailNotifications} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Напоминания об интервью</Text>
              <br />
              <Text type="secondary">За 1 час до начала интервью</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.interviewReminders} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Обновления кандидатов</Text>
              <br />
              <Text type="secondary">Когда кандидат проходит интервью</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.candidateUpdates} />
          </div>
        </Space>
      </Card>

      <Card title="Отчеты" className="settings-card" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Еженедельные отчеты</Text>
              <br />
              <Text type="secondary">Статистика за неделю каждый понедельник</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.weeklyReports} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Месячные отчеты</Text>
              <br />
              <Text type="secondary">Подробная аналитика в начале месяца</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.monthlyReports} />
          </div>
        </Space>
      </Card>

      <Card title="Системные уведомления" className="settings-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Браузерные уведомления</Text>
              <br />
              <Text type="secondary">Push-уведомления в браузере</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.browserNotifications} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Системные оповещения</Text>
              <br />
              <Text type="secondary">Важные обновления системы</Text>
            </div>
            <Switch defaultChecked={settingsData?.notifications.systemAlerts} />
          </div>
        </Space>
      </Card>
    </div>
  );

  const renderInterviewSettings = () => (
    <div>
      <Card title="Настройки интервью" className="settings-card" style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Длительность интервью по умолчанию</Text>
              <br />
              <InputNumber
                min={15}
                max={180}
                step={15}
                defaultValue={settingsData?.interview.defaultDuration}
                addonAfter="мин"
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Буферное время</Text>
              <br />
              <InputNumber
                min={0}
                max={60}
                step={5}
                defaultValue={settingsData?.interview.bufferTime}
                addonAfter="мин"
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Максимум переносов</Text>
              <br />
              <InputNumber
                min={0}
                max={5}
                defaultValue={settingsData?.interview.maxReschedulings}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Запись интервью</Text>
              <br />
              <Select
                defaultValue={settingsData?.interview.recordingSetting}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Option value="always">Всегда записывать</Option>
                <Option value="ask">Спрашивать у кандидата</Option>
                <Option value="never">Никогда не записывать</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Автоподтверждение интервью</Text>
              <br />
              <Text type="secondary">Автоматически подтверждать записи кандидатов</Text>
            </div>
            <Switch defaultChecked={settingsData?.interview.autoConfirmation} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>AI анализ интервью</Text>
              <br />
              <Text type="secondary">Включить автоматический анализ ответов</Text>
            </div>
            <Switch defaultChecked={settingsData?.interview.aiAnalysisEnabled} />
          </div>
        </div>

        <div>
          <Text strong>Порог качества соединения (%)</Text>
          <Slider
            min={50}
            max={100}
            defaultValue={settingsData?.interview.qualityThreshold}
            marks={{ 50: '50%', 75: '75%', 100: '100%' }}
            style={{ marginTop: 8 }}
          />
        </div>
      </Card>

      <Card title="Пользовательские вопросы" className="settings-card">
        <List
          dataSource={settingsData?.interview.customQuestions}
          renderItem={(question, index) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => showWarning({
                    title: 'Вопрос удален',
                    message: 'Вопрос удален из списка'
                  })}
                />
              ]}
            >
              <Text>{question}</Text>
            </List.Item>
          )}
        />
        <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%', marginTop: 16 }}>
          Добавить вопрос
        </Button>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div>
      <Card title="Безопасность аккаунта" className="settings-card" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Двухфакторная аутентификация</Text>
              <br />
              <Text type="secondary">Дополнительная защита аккаунта</Text>
            </div>
            <Switch defaultChecked={settingsData?.security.twoFactorAuth} />
          </div>
          
          <Divider />
          
          <div>
            <Text strong>Время сессии (минуты)</Text>
            <br />
            <InputNumber
              min={30}
              max={1440}
              step={30}
              defaultValue={settingsData?.security.sessionTimeout}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
          
          <div>
            <Text strong>Период хранения данных (дни)</Text>
            <br />
            <InputNumber
              min={30}
              max={2555}
              step={30}
              defaultValue={settingsData?.security.dataRetention}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
        </Space>
      </Card>

      <Card title="Политика паролей" className="settings-card" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Минимальная длина</Text>
              <br />
              <InputNumber
                min={6}
                max={32}
                defaultValue={settingsData?.security.passwordPolicy.minLength}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ marginTop: 8 }}>
              <Checkbox defaultChecked={settingsData?.security.passwordPolicy.requireUppercase}>
                Заглавные буквы
              </Checkbox>
              <Checkbox defaultChecked={settingsData?.security.passwordPolicy.requireNumbers}>
                Цифры
              </Checkbox>
              <Checkbox defaultChecked={settingsData?.security.passwordPolicy.requireSpecialChars}>
                Специальные символы
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Белый список IP" className="settings-card">
        <List
          dataSource={settingsData?.security.ipWhitelist}
          renderItem={(ip) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                />
              ]}
            >
              <Text code>{ip}</Text>
            </List.Item>
          )}
        />
        <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%', marginTop: 16 }}>
          Добавить IP адрес
        </Button>
      </Card>
    </div>
  );

  const renderTeamSettings = () => {
    return <TeamManagementComponent />;
  };


  const renderBillingSettings = () => (
    <div>
      <Card title="Текущий план" className="settings-card" style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                {settingsData?.billing.plan}
              </Title>
              <Text type="secondary">
                Следующее списание: {new Date(settingsData?.billing.nextBilling!).toLocaleDateString('ru-RU')}
              </Text>
            </div>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" size="large" style={{ width: '100%' }}>
                Улучшить план
              </Button>
              <Button style={{ width: '100%' }}>
                Изменить период оплаты
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Использование ресурсов" className="settings-card">
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text strong>Интервью</Text>
              <div style={{ margin: '8px 0' }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {settingsData?.billing.usage.interviews}
                </Text>
                <Text type="secondary"> / {settingsData?.billing.limits.interviews}</Text>
              </div>
              <Progress 
                percent={(settingsData?.billing.usage.interviews! / settingsData?.billing.limits.interviews!) * 100}
                strokeColor="#1890ff"
                showInfo={false}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text strong>Хранилище</Text>
              <div style={{ margin: '8px 0' }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {settingsData?.billing.usage.storage}
                </Text>
                <Text type="secondary"> / {settingsData?.billing.limits.storage} ГБ</Text>
              </div>
              <Progress 
                percent={(settingsData?.billing.usage.storage! / settingsData?.billing.limits.storage!) * 100}
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Text strong>Пользователи</Text>
              <div style={{ margin: '8px 0' }}>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {settingsData?.billing.usage.users}
                </Text>
                <Text type="secondary"> / {settingsData?.billing.limits.users}</Text>
              </div>
              <Progress 
                percent={(settingsData?.billing.usage.users! / settingsData?.billing.limits.users!) * 100}
                strokeColor="#faad14"
                showInfo={false}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header-section">
          <div className="profile-hero">
            <Title level={2} className="profile-page-title">
              Загрузка настроек...
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
              Настройки
            </Title>
          </div>
          <div className="profile-actions">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => form.submit()}
            >
              Сохранить изменения
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
                key: 'general',
                label: 'Общие',
                icon: <SettingOutlined />,
                children: renderGeneralSettings(),
              },
              {
                key: 'notifications',
                label: 'Уведомления',
                icon: <NotificationOutlined />,
                children: renderNotificationSettings(),
              },
              {
                key: 'interview',
                label: 'Интервью',
                icon: <TeamOutlined />,
                children: renderInterviewSettings(),
              },
              {
                key: 'security',
                label: 'Безопасность',
                icon: <SecurityScanOutlined />,
                children: renderSecuritySettings(),
              },
              {
                key: 'team',
                label: 'Команда',
                icon: <TeamOutlined />,
                children: renderTeamSettings(),
              },
              {
                key: 'billing',
                label: 'Тарифы',
                icon: <GlobalOutlined />,
                children: renderBillingSettings(),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default CompanySettings;
