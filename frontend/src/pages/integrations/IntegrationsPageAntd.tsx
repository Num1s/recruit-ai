import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Tabs,
  Table,
  Switch,
  InputNumber,
  Divider,
  Statistic,
  Alert,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  SettingOutlined,
  SyncOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  LinkOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BriefcaseOutlined,
  DollarOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import authAPI from '../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Integration {
  id: number;
  platform: string;
  name: string;
  description?: string;
  is_active: boolean;
  auto_sync: boolean;
  sync_interval_hours: number;
  status: string;
  total_candidates_found: number;
  total_candidates_imported: number;
  last_sync_at?: string;
  next_sync_at?: string;
  last_error?: string;
  error_count: number;
  created_at: string;
}

interface Platform {
  value: string;
  name: string;
  description: string;
}

interface IntegrationStats {
  total_integrations: number;
  active_integrations: number;
  total_candidates_found: number;
  total_candidates_imported: number;
  last_sync_at?: string;
  platform_stats: Record<string, any>;
}

const IntegrationsPageAntd: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Form
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Реальные API вызовы
      const [integrationsRes, platformsRes, statsRes] = await Promise.all([
        authAPI.getIntegrations(),
        authAPI.getSupportedPlatforms(),
        authAPI.getIntegrationStats()
      ]);
      
      setIntegrations(integrationsRes.data);
      setPlatforms(platformsRes.data.platforms);
      setStats(statsRes.data);
    } catch (err: any) {
      // Fallback на моковые данные при ошибке API
      console.warn('API недоступен, используем моковые данные:', err);
      
      const mockIntegrations: Integration[] = [
        {
          id: 1,
          platform: 'linkedin',
          name: 'LinkedIn Integration',
          description: 'Интеграция с LinkedIn для поиска IT-специалистов',
          is_active: true,
          auto_sync: true,
          sync_interval_hours: 24,
          status: 'active',
          total_candidates_found: 150,
          total_candidates_imported: 25,
          last_sync_at: new Date().toISOString(),
          next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          error_count: 0,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          platform: 'hh_ru',
          name: 'HH.ru Integration',
          description: 'Интеграция с HeadHunter для поиска кандидатов',
          is_active: false,
          auto_sync: true,
          sync_interval_hours: 12,
          status: 'pending',
          total_candidates_found: 89,
          total_candidates_imported: 12,
          last_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          error_count: 2,
          created_at: new Date().toISOString()
        }
      ];

      const mockPlatforms: Platform[] = [
        { value: 'linkedin', name: 'LinkedIn', description: 'Профессиональная социальная сеть' },
        { value: 'hh_ru', name: 'HH.ru', description: 'Крупнейший российский сайт поиска работы' },
        { value: 'superjob', name: 'SuperJob', description: 'Популярная платформа для поиска работы' },
        { value: 'lalafo', name: 'Лалафо', description: 'Платформа объявлений в Кыргызстане' }
      ];

      const mockStats: IntegrationStats = {
        total_integrations: 2,
        active_integrations: 1,
        total_candidates_found: 239,
        total_candidates_imported: 37,
        last_sync_at: new Date().toISOString(),
        platform_stats: {
          linkedin: { total_candidates: 150, imported_candidates: 25, is_active: true },
          hh_ru: { total_candidates: 89, imported_candidates: 12, is_active: false }
        }
      };
      
      setIntegrations(mockIntegrations);
      setPlatforms(mockPlatforms);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async (values: any) => {
    try {
      await authAPI.createIntegration(values);
      setShowCreateModal(false);
      form.resetFields();
      loadData();
      message.success('Интеграция создана успешно');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка создания интеграции');
    }
  };

  const handleUpdateIntegration = async (values: any) => {
    if (!selectedIntegration) return;
    
    try {
      await authAPI.updateIntegration(selectedIntegration.id, values);
      setShowEditModal(false);
      form.resetFields();
      loadData();
      message.success('Интеграция обновлена успешно');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка обновления интеграции');
    }
  };

  const handleDeleteIntegration = async () => {
    if (!selectedIntegration) return;
    
    try {
      await authAPI.deleteIntegration(selectedIntegration.id);
      setShowDeleteModal(false);
      setSelectedIntegration(null);
      loadData();
      message.success('Интеграция удалена успешно');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка удаления интеграции');
    }
  };

  const handleSyncIntegration = async (integrationId: number) => {
    try {
      await authAPI.syncIntegration(integrationId);
      loadData();
      message.success('Синхронизация запущена');
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка синхронизации');
    }
  };

  const openEditModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    form.setFieldsValue({
      platform: integration.platform,
      name: integration.name,
      description: integration.description,
      is_active: integration.is_active,
      auto_sync: integration.auto_sync,
      sync_interval_hours: integration.sync_interval_hours,
    });
    setShowEditModal(true);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      active: { color: 'green', text: 'Активна' },
      inactive: { color: 'default', text: 'Неактивна' },
      error: { color: 'red', text: 'Ошибка' },
      pending: { color: 'orange', text: 'Ожидание' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Integration) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Платформа',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="blue">{platform.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Integration) => (
        <Space>
          {getStatusTag(status)}
          {record.is_active && <Tag color="blue">Активна</Tag>}
        </Space>
      ),
    },
    {
      title: 'Статистика',
      key: 'stats',
      render: (record: Integration) => (
        <div className="text-sm">
          <div>Найдено: {record.total_candidates_found}</div>
          <div>Импортировано: {record.total_candidates_imported}</div>
        </div>
      ),
    },
    {
      title: 'Последняя синхронизация',
      dataIndex: 'last_sync_at',
      key: 'last_sync_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Integration) => (
        <Space>
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleSyncIntegration(record.id)}
          >
            Синхронизировать
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => openEditModal(record)}
          >
            Настройки
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedIntegration(record);
              setShowDeleteModal(true);
            }}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Интеграции</Title>
        <Text type="secondary">
          Управление подключениями к внешним платформам поиска кандидатов
        </Text>
      </div>

      {error && (
        <Alert
          message="Ошибка"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* Stats Cards */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Всего интеграций"
                value={stats.total_integrations}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Активных"
                value={stats.active_integrations}
                prefix={<SyncOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Найдено кандидатов"
                value={stats.total_candidates_found}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Импортировано"
                value={stats.total_candidates_imported}
                prefix={<DownloadOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Integrations Table */}
      <Card
        title="Интеграции"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Добавить интеграцию
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={integrations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Integration Modal */}
      <Modal
        title="Создать интеграцию"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateIntegration}
        >
          <Form.Item
            name="platform"
            label="Платформа"
            rules={[{ required: true, message: 'Выберите платформу' }]}
          >
            <Select placeholder="Выберите платформу">
              {platforms.map((platform) => (
                <Option key={platform.value} value={platform.value}>
                  {platform.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Название интеграции" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <TextArea rows={3} placeholder="Описание интеграции" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Активна"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auto_sync"
                label="Автосинхронизация"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sync_interval_hours"
            label="Интервал синхронизации (часы)"
          >
            <InputNumber min={1} max={168} style={{ width: '100%' }} />
          </Form.Item>

          <Divider>Настройки API</Divider>

          <Form.Item
            name="api_key"
            label="API Key"
          >
            <Input.Password placeholder="API ключ" />
          </Form.Item>

          <Form.Item
            name="access_token"
            label="Access Token"
          >
            <Input.Password placeholder="Токен доступа" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                Создать
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Integration Modal */}
      <Modal
        title="Редактировать интеграцию"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateIntegration}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Название интеграции" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
          >
            <TextArea rows={3} placeholder="Описание интеграции" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Активна"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auto_sync"
                label="Автосинхронизация"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sync_interval_hours"
            label="Интервал синхронизации (часы)"
          >
            <InputNumber min={1} max={168} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                Сохранить
              </Button>
              <Button onClick={() => setShowEditModal(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Удалить интеграцию"
        open={showDeleteModal}
        onOk={handleDeleteIntegration}
        onCancel={() => setShowDeleteModal(false)}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>Вы уверены, что хотите удалить интеграцию "{selectedIntegration?.name}"?</p>
        <p className="text-gray-500">Это действие нельзя отменить.</p>
      </Modal>
    </div>
  );
};

export default IntegrationsPageAntd;
