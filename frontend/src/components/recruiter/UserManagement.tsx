import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

interface Recruiter {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
}

interface Stream {
  id: number;
  name: string;
}

const UserManagement: React.FC = () => {
  const { user, isAdmin, isRecruitLead, isSeniorRecruiter } = useAuth();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<Recruiter | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRecruiters();
    fetchStreams();
  }, []);

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getRecruiters();
      setRecruiters(response.data);
    } catch (error: any) {
      message.error('Ошибка при загрузке рекрутеров');
      console.error('Error fetching recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async () => {
    try {
      const response = await authAPI.getAvailableStreams();
      setStreams(response.data);
    } catch (error: any) {
      console.error('Error fetching streams:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (recruiter: Recruiter) => {
    setEditingUser(recruiter);
    form.setFieldsValue({
      email: recruiter.email,
      first_name: recruiter.first_name,
      last_name: recruiter.last_name,
      role: recruiter.role,
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Обновление роли пользователя
        await authAPI.updateUserRole(editingUser.id, {
          role: values.role,
          stream_id: values.stream_id,
        });
        message.success('Пользователь успешно обновлен');
      } else {
        // Создание нового пользователя
        await authAPI.createUser(values);
        message.success('Пользователь успешно создан');
      }
      
      setModalVisible(false);
      fetchRecruiters();
    } catch (error: any) {
      message.error('Ошибка при сохранении пользователя');
      console.error('Error saving user:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'recruit_lead':
        return <CrownOutlined style={{ color: '#ff4d4f' }} />;
      case 'senior_recruiter':
        return <CrownOutlined style={{ color: '#fa8c16' }} />;
      case 'recruiter':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'recruit_lead':
        return 'Главный рекрутер';
      case 'senior_recruiter':
        return 'Старший рекрутер';
      case 'recruiter':
        return 'Рекрутер';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'recruit_lead':
        return 'red';
      case 'senior_recruiter':
        return 'orange';
      case 'recruiter':
        return 'blue';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Пользователь',
      key: 'user',
      render: (_, record: Recruiter) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.first_name} {record.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {getRoleText(role)}
        </Tag>
      ),
      filters: [
        { text: 'Главный рекрутер', value: 'recruit_lead' },
        { text: 'Старший рекрутер', value: 'senior_recruiter' },
        { text: 'Рекрутер', value: 'recruiter' },
      ],
      onFilter: (value: string, record: Recruiter) => record.role === value,
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Активен' : 'Заблокирован'}
        </Tag>
      ),
      filters: [
        { text: 'Активен', value: true },
        { text: 'Заблокирован', value: false },
      ],
      onFilter: (value: boolean, record: Recruiter) => record.is_active === value,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Recruiter) => (
        <Space>
          <Tooltip title="Редактировать пользователя">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            >
              Редактировать
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const totalUsers = recruiters.length;
  const activeUsers = recruiters.filter(u => u.is_active).length;
  const recruitLeads = recruiters.filter(u => u.role === 'recruit_lead').length;
  const seniorRecruiters = recruiters.filter(u => u.role === 'senior_recruiter').length;
  const regularRecruiters = recruiters.filter(u => u.role === 'recruiter').length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalUsers}
              </div>
              <div>Всего пользователей</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {activeUsers}
              </div>
              <div>Активных пользователей</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {seniorRecruiters}
              </div>
              <div>Старших рекрутеров</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {regularRecruiters}
              </div>
              <div>Рекрутеров</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Управление пользователями
          </Title>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Создать пользователя
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={recruiters}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} пользователей`,
          }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            email: '',
            first_name: '',
            last_name: '',
            role: 'recruiter',
            stream_id: undefined,
          }}
        >
          {!editingUser && (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Пожалуйста, введите email' },
                  { type: 'email', message: 'Введите корректный email' },
                ]}
              >
                <Input placeholder="user@example.com" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Пароль"
                rules={[
                  { required: true, message: 'Пожалуйста, введите пароль' },
                  { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
                ]}
              >
                <Input.Password placeholder="Минимум 6 символов" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="first_name"
            label="Имя"
            rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}
          >
            <Input placeholder="Имя" />
          </Form.Item>

          <Form.Item
            name="last_name"
            label="Фамилия"
            rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}
          >
            <Input placeholder="Фамилия" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Пожалуйста, выберите роль' }]}
          >
            <Select placeholder="Выберите роль">
              <Option value="recruiter">Рекрутер</Option>
              <Option value="senior_recruiter">Старший рекрутер</Option>
              {isAdmin && <Option value="recruit_lead">Главный рекрутер</Option>}
              {isAdmin && <Option value="admin">Администратор</Option>}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) => {
              const role = getFieldValue('role');
              return role === 'recruiter' ? (
                <Form.Item
                  name="stream_id"
                  label="Поток"
                  rules={[{ required: true, message: 'Пожалуйста, выберите поток' }]}
                >
                  <Select placeholder="Выберите поток">
                    {streams.map((stream) => (
                      <Option key={stream.id} value={stream.id}>
                        {stream.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
