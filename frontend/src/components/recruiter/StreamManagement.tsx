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
  Statistic,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

const { Title } = Typography;
const { Option } = Select;

interface Stream {
  id: number;
  name: string;
  senior_recruiter_id?: number;
  recruit_lead_id?: number;
  created_at: string;
  senior_recruiter?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  recruit_lead?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  recruiters: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }>;
}

interface AvailableRecruiter {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

const StreamManagement: React.FC = () => {
  const { user, isRecruitLead, isSeniorRecruiter } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [availableRecruiters, setAvailableRecruiters] = useState<AvailableRecruiter[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStreams();
    if (isRecruitLead || isSeniorRecruiter) {
      fetchAvailableRecruiters();
    }
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getStreams();
      setStreams(response.data);
    } catch (error: any) {
      message.error('Ошибка при загрузке потоков');
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRecruiters = async () => {
    try {
      const response = await authAPI.getAvailableRecruiters();
      setAvailableRecruiters(response.data);
    } catch (error: any) {
      console.error('Error fetching available recruiters:', error);
    }
  };

  const handleCreateStream = () => {
    setEditingStream(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditStream = (stream: Stream) => {
    setEditingStream(stream);
    form.setFieldsValue({
      name: stream.name,
      senior_recruiter_id: stream.senior_recruiter_id,
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingStream) {
        await authAPI.updateStream(editingStream.id, values);
        message.success('Поток успешно обновлен');
      } else {
        await authAPI.createStream(values);
        message.success('Поток успешно создан');
      }
      
      setModalVisible(false);
      fetchStreams();
    } catch (error: any) {
      message.error('Ошибка при сохранении потока');
      console.error('Error saving stream:', error);
    }
  };

  const handleDeleteStream = async (streamId: number) => {
    try {
      await authAPI.deleteStream(streamId);
      message.success('Поток успешно удален');
      fetchStreams();
    } catch (error: any) {
      message.error('Ошибка при удалении потока');
      console.error('Error deleting stream:', error);
    }
  };

  const handleAddRecruiter = async (streamId: number, recruiterId: number) => {
    try {
      await authAPI.addRecruiterToStream(streamId, recruiterId);
      message.success('Рекрутер добавлен в поток');
      fetchStreams();
      fetchAvailableRecruiters();
    } catch (error: any) {
      message.error('Ошибка при добавлении рекрутера');
      console.error('Error adding recruiter:', error);
    }
  };

  const handleRemoveRecruiter = async (streamId: number, recruiterId: number) => {
    try {
      await authAPI.removeRecruiterFromStream(streamId, recruiterId);
      message.success('Рекрутер удален из потока');
      fetchStreams();
      fetchAvailableRecruiters();
    } catch (error: any) {
      message.error('Ошибка при удалении рекрутера');
      console.error('Error removing recruiter:', error);
    }
  };

  const columns = [
    {
      title: 'Название потока',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Stream) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.id}
          </div>
        </div>
      ),
    },
    {
      title: 'Старший рекрутер',
      dataIndex: ['senior_recruiter'],
      key: 'senior_recruiter',
      render: (senior: Stream['senior_recruiter']) => 
        senior ? (
          <div>
            <div>{senior.first_name} {senior.last_name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{senior.email}</div>
          </div>
        ) : (
          <Tag color="orange">Не назначен</Tag>
        ),
    },
    {
      title: 'Рекрутеры',
      dataIndex: 'recruiters',
      key: 'recruiters',
      render: (recruiters: Stream['recruiters']) => (
        <div>
          <Statistic
            value={recruiters.length}
            prefix={<TeamOutlined />}
            valueStyle={{ fontSize: '16px' }}
          />
          {recruiters.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {recruiters.slice(0, 2).map((recruiter) => (
                <Tag key={recruiter.id} size="small">
                  {recruiter.first_name} {recruiter.last_name}
                </Tag>
              ))}
              {recruiters.length > 2 && (
                <Tag size="small">+{recruiters.length - 2} еще</Tag>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: Stream) => (
        <Space>
          {isRecruitLead && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditStream(record)}
              >
                Редактировать
              </Button>
              <Popconfirm
                title="Вы уверены, что хотите удалить этот поток?"
                onConfirm={() => handleDeleteStream(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={record.recruiters.length > 0}
                >
                  Удалить
                </Button>
              </Popconfirm>
            </>
          )}
          
          {/* Добавить рекрутера */}
          {availableRecruiters.length > 0 && (
            <Select
              placeholder="Добавить рекрутера"
              style={{ width: 200 }}
              size="small"
              onSelect={(recruiterId: number) => handleAddRecruiter(record.id, recruiterId)}
            >
              {availableRecruiters.map((recruiter) => (
                <Option key={recruiter.id} value={recruiter.id}>
                  {recruiter.first_name} {recruiter.last_name}
                </Option>
              ))}
            </Select>
          )}
          
          {/* Удалить рекрутера */}
          {record.recruiters.length > 0 && (
            <Select
              placeholder="Удалить рекрутера"
              style={{ width: 200 }}
              size="small"
              onSelect={(recruiterId: number) => handleRemoveRecruiter(record.id, recruiterId)}
            >
              {record.recruiters.map((recruiter) => (
                <Option key={recruiter.id} value={recruiter.id}>
                  {recruiter.first_name} {recruiter.last_name}
                </Option>
              ))}
            </Select>
          )}
        </Space>
      ),
    },
  ];

  const totalRecruiters = streams.reduce((sum, stream) => sum + stream.recruiters.length, 0);
  const totalStreams = streams.length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Всего потоков"
              value={totalStreams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Всего рекрутеров"
              value={totalRecruiters}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Доступных рекрутеров"
              value={availableRecruiters.length}
              prefix={<UserDeleteOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Управление потоками рекрутинга
          </Title>
          {isRecruitLead && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateStream}
            >
              Создать поток
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={streams}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} потоков`,
          }}
        />
      </Card>

      <Modal
        title={editingStream ? 'Редактировать поток' : 'Создать поток'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: '',
            senior_recruiter_id: undefined,
          }}
        >
          <Form.Item
            name="name"
            label="Название потока"
            rules={[
              { required: true, message: 'Пожалуйста, введите название потока' },
              { min: 2, message: 'Название должно содержать минимум 2 символа' },
            ]}
          >
            <Input placeholder="Например: Frontend-направление" />
          </Form.Item>

          {isRecruitLead && (
            <Form.Item
              name="senior_recruiter_id"
              label="Старший рекрутер"
              help="Оставьте пустым, чтобы назначить позже"
            >
              <Select placeholder="Выберите старшего рекрутера" allowClear>
                {/* Здесь можно добавить список доступных старших рекрутеров */}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default StreamManagement;
