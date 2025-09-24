import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Switch,
  Select,
  Divider,
  Space,
  message,
  Alert,
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  SaveOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const RecruiterSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    // Загружаем текущие настройки
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Здесь должен быть API вызов для загрузки настроек
      // const response = await authAPI.getSettings();
      // form.setFieldsValue(response.data);
      
      // Временные настройки по умолчанию
      form.setFieldsValue({
        notifications: {
          email_notifications: true,
          push_notifications: false,
          weekly_reports: true,
          new_candidates: true,
        },
        preferences: {
          language: 'ru',
          timezone: 'Asia/Bishkek',
          date_format: 'DD.MM.YYYY',
        },
      });
    } catch (error: any) {
      message.error('Ошибка при загрузке настроек');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values: any) => {
    try {
      setSaving(true);
      // Здесь должен быть API вызов для сохранения настроек
      // await authAPI.updateSettings(values);
      message.success('Настройки успешно сохранены');
    } catch (error: any) {
      message.error('Ошибка при сохранении настроек');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setSaving(true);
      // Здесь должен быть API вызов для смены пароля
      // await authAPI.changePassword(values);
      message.success('Пароль успешно изменен');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error('Ошибка при смене пароля');
      console.error('Error changing password:', error);
    } finally {
      setSaving(false);
    }
  };

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
          <Title level={2}>Настройки</Title>
          <Text type="secondary">
            Управление настройками аккаунта и предпочтениями
          </Text>
        </div>

        <Row gutter={24}>
          <Col span={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveSettings}
            >
              {/* Уведомления */}
              <Card 
                title={
                  <Space>
                    <BellOutlined />
                    Уведомления
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                <Form.Item
                  name={['notifications', 'email_notifications']}
                  label="Email уведомления"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name={['notifications', 'push_notifications']}
                  label="Push уведомления"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name={['notifications', 'weekly_reports']}
                  label="Еженедельные отчеты"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name={['notifications', 'new_candidates']}
                  label="Уведомления о новых кандидатах"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>

              {/* Предпочтения */}
              <Card 
                title={
                  <Space>
                    <SettingOutlined />
                    Предпочтения
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={['preferences', 'language']}
                      label="Язык интерфейса"
                    >
                      <Select>
                        <Option value="ru">Русский</Option>
                        <Option value="en">English</Option>
                        <Option value="ky">Кыргызча</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['preferences', 'timezone']}
                      label="Часовой пояс"
                    >
                      <Select>
                        <Option value="Asia/Bishkek">Бишкек (UTC+6)</Option>
                        <Option value="Europe/Moscow">Москва (UTC+3)</Option>
                        <Option value="UTC">UTC (UTC+0)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name={['preferences', 'date_format']}
                  label="Формат даты"
                >
                  <Select>
                    <Option value="DD.MM.YYYY">DD.MM.YYYY</Option>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />}
                    loading={saving}
                  >
                    Сохранить настройки
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    Сбросить
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>

          <Col span={8}>
            {/* Смена пароля */}
            <Card 
              title={
                <Space>
                  <LockOutlined />
                  Безопасность
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Alert
                message="Смена пароля"
                description="Используйте надежный пароль для защиты вашего аккаунта"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Form.Item
                  name="current_password"
                  label="Текущий пароль"
                  rules={[{ required: true, message: 'Введите текущий пароль' }]}
                >
                  <Input.Password placeholder="Текущий пароль" />
                </Form.Item>

                <Form.Item
                  name="new_password"
                  label="Новый пароль"
                  rules={[
                    { required: true, message: 'Введите новый пароль' },
                    { min: 6, message: 'Пароль должен содержать минимум 6 символов' }
                  ]}
                >
                  <Input.Password placeholder="Новый пароль" />
                </Form.Item>

                <Form.Item
                  name="confirm_password"
                  label="Подтвердите пароль"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: 'Подтвердите пароль' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Пароли не совпадают'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Подтвердите пароль" />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SecurityScanOutlined />}
                    loading={saving}
                    block
                  >
                    Изменить пароль
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Информация об аккаунте */}
            <Card title="Информация об аккаунте">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Роль:</Text>
                  <br />
                  <Text>{user?.role}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>Email:</Text>
                  <br />
                  <Text>{user?.email}</Text>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <Text strong>Дата регистрации:</Text>
                  <br />
                  <Text>{user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RecruiterSettings;
