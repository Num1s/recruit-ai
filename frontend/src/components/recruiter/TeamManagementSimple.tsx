import React, { useState } from 'react';
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
  TeamOutlined,
  CrownOutlined,
  UserOutlined,
} from '@ant-design/icons';

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

const TeamManagementSimple: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([
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
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleCreateMember = async (values: any) => {
    try {
      console.log('Creating user:', values);
      
      const newMember: TeamMember = {
        id: Date.now(),
        name: `${values.first_name} ${values.last_name}`,
        email: values.email,
        role: values.role,
        permissions: ['view_candidates', 'conduct_interviews'],
        created_at: new Date().toLocaleDateString('ru-RU')
      };

      setMembers([...members, newMember]);
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('Участник команды успешно добавлен!');
    } catch (error) {
      message.error('Ошибка при создании участника команды');
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      setMembers(members.filter(member => member.id !== id));
      message.success('Участник команды удален');
    } catch (error) {
      message.error('Ошибка при удалении участника');
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

export default TeamManagementSimple;

