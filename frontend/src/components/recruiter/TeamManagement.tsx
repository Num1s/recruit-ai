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
  Tag,
  Popconfirm,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  DeleteOutlined,
  SettingOutlined,
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { authAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'recruit_lead',
      name: 'Recruit Lead',
      permissions: ['full_access', 'manage_streams', 'view_analytics', 'manage_users']
    },
    {
      id: 'senior_recruiter',
      name: 'Senior Recruiter',
      permissions: ['manage_stream', 'view_stream_analytics', 'manage_recruiters']
    },
    {
      id: 'recruiter',
      name: 'Recruiter',
      permissions: ['view_candidates', 'conduct_interviews', 'manage_jobs']
    }
  ]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();

  // Загрузка данных
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await authAPI.getTeamMembers();
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading team members:', error);
      // Временные данные для демонстрации
      setMembers([
        {
          id: 1,
          name: 'Анна Петрова',
          email: 'anna@techcorp.com',
          role: 'HR Manager',
          permissions: ['view_candidates', 'conduct_interviews', 'manage_jobs'],
          created_at: '15.01.2024'
        },
        {
          id: 2,
          name: 'Михаил Сидоров',
          email: 'mikhail@techcorp.com',
          role: 'Tech Lead',
          permissions: ['view_candidates', 'conduct_interviews', 'technical_assessment'],
          created_at: '14.01.2024'
        }
      ]);
    }
  };

  const handleCreateMember = async (values: any) => {
    try {
      const response = await authAPI.createTeamMember({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        role: values.role,
        stream_id: values.stream_id
      });

      const newMember: TeamMember = {
        id: response.data.id,
        name: `${values.first_name} ${values.last_name}`,
        email: values.email,
        role: values.role,
        permissions: roles.find(r => r.id === values.role)?.permissions || [],
        created_at: new Date().toLocaleDateString('ru-RU')
      };

      setMembers([...members, newMember]);
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('Участник команды успешно добавлен!');
    } catch (error: any) {
      console.error('Error creating team member:', error);
      message.error(error.response?.data?.detail || 'Ошибка при создании участника команды');
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await authAPI.deleteTeamMember(id);
      setMembers(members.filter(member => member.id !== id));
      message.success('Участник команды удален');
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      message.error(error.response?.data?.detail || 'Ошибка при удалении участника');
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue(role);
    setIsRoleModalVisible(true);
  };

  const handleSaveRole = async (values: any) => {
    try {
      if (editingRole) {
        const updatedRoles = roles.map(role => 
          role.id === editingRole.id 
            ? { ...role, name: values.name, permissions: values.permissions }
            : role
        );
        setRoles(updatedRoles);
        message.success('Роль обновлена');
      }
      setIsRoleModalVisible(false);
      setEditingRole(null);
      roleForm.resetFields();
    } catch (error) {
      message.error('Ошибка при сохранении роли');
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
      title: 'Права',
      key: 'permissions',
      render: (record: TeamMember) => (
        <div>
          {record.permissions.slice(0, 2).map(permission => (
            <Tag key={permission} size="small">{permission}</Tag>
          ))}
          {record.permissions.length > 2 && (
            <Tag size="small">+{record.permissions.length - 2} еще</Tag>
          )}
        </div>
      ),
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

  const roleColumns = [
    {
      title: 'Роль',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Role) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.id}</div>
        </div>
      ),
    },
    {
      title: 'Права',
      key: 'permissions',
      render: (record: Role) => (
        <div>
          {record.permissions.map(permission => (
            <Tag key={permission} size="small">{permission}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: Role) => (
        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={() => handleEditRole(record)}
        >
          Настроить
        </Button>
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
              value={roles.length}
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

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="Участники команды"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                Пригласить участника
              </Button>
            }
          >
            <Table
              columns={memberColumns}
              dataSource={members}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="Роли и права"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRole(null);
                  setIsRoleModalVisible(true);
                }}
              >
                Создать роль
              </Button>
            }
          >
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

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
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="stream_id"
            label="Поток (для рекрутеров)"
            dependencies={['role']}
          >
            <Select placeholder="Выберите поток (опционально)">
              <Option value={1}>Frontend-направление</Option>
              <Option value={2}>Backend-направление</Option>
              <Option value={3}>DevOps-направление</Option>
            </Select>
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

      {/* Модальное окно редактирования роли */}
      <Modal
        title={editingRole ? 'Редактировать роль' : 'Создать роль'}
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false);
          setEditingRole(null);
          roleForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleSaveRole}
        >
          <Form.Item
            name="name"
            label="Название роли"
            rules={[{ required: true, message: 'Введите название роли' }]}
          >
            <Input placeholder="Например: Senior Recruiter" />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Права доступа"
            rules={[{ required: true, message: 'Выберите права доступа' }]}
          >
            <Select
              mode="multiple"
              placeholder="Выберите права доступа"
              options={[
                { label: 'Полный доступ', value: 'full_access' },
                { label: 'Управление потоками', value: 'manage_streams' },
                { label: 'Просмотр аналитики', value: 'view_analytics' },
                { label: 'Управление пользователями', value: 'manage_users' },
                { label: 'Управление потоком', value: 'manage_stream' },
                { label: 'Аналитика потока', value: 'view_stream_analytics' },
                { label: 'Управление рекрутерами', value: 'manage_recruiters' },
                { label: 'Просмотр кандидатов', value: 'view_candidates' },
                { label: 'Проведение интервью', value: 'conduct_interviews' },
                { label: 'Управление вакансиями', value: 'manage_jobs' },
                { label: 'Техническая оценка', value: 'technical_assessment' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Сохранить' : 'Создать роль'}
              </Button>
              <Button onClick={() => {
                setIsRoleModalVisible(false);
                setEditingRole(null);
                roleForm.resetFields();
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
