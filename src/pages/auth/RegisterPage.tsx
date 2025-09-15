import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Select, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  role: 'candidate' | 'company';
  phone?: string;
  company_name?: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') as 'candidate' | 'company' || 'candidate';
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'company'>(initialRole);

  React.useEffect(() => {
    // Если пользователь уже авторизован, редиректим
    if (user) {
      const redirectPath = user.role === 'candidate' ? '/candidate/dashboard' : '/company/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const registerData = {
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        role: selectedRole,
        phone: values.phone,
        ...(selectedRole === 'company' && { company_name: values.company_name }),
      };

      await register(registerData);
      // Редирект происходит автоматически через useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: 'candidate' | 'company') => {
    setSelectedRole(role);
    // Очищаем поле company_name если переключились на кандидата
    if (role === 'candidate') {
      form.setFieldsValue({ company_name: undefined });
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-form" style={{ maxWidth: 500, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            Recruit.ai
          </Title>
          <Text type="secondary">Создайте новый аккаунт</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          size="large"
          initialValues={{ role: initialRole }}
        >
          {/* Выбор роли */}
          <Form.Item label="Тип аккаунта" style={{ marginBottom: 24 }}>
            <Radio.Group
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              size="large"
            >
              <Radio.Button value="candidate" style={{ width: '50%', textAlign: 'center' }}>
                <UserOutlined /> Кандидат
              </Radio.Button>
              <Radio.Button value="company" style={{ width: '50%', textAlign: 'center' }}>
                <BankOutlined /> Компания
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* Основные поля */}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="first_name"
              label="Имя"
              rules={[{ required: true, message: 'Введите имя' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Иван" />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Фамилия"
              rules={[{ required: true, message: 'Введите фамилию' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Иванов" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Телефон (опционально)"
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+996 xxx xxx xxx"
              autoComplete="tel"
            />
          </Form.Item>

          {/* Поле для названия компании */}
          {selectedRole === 'company' && (
            <Form.Item
              name="company_name"
              label="Название компании"
              rules={[{ required: true, message: 'Введите название компании' }]}
            >
              <Input
                prefix={<BankOutlined />}
                placeholder="ООО 'Ваша компания'"
              />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Подтверждение пароля"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Повторите пароль"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Зарегистрироваться
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Уже есть аккаунт?{' '}
              <Link to="/login" style={{ color: '#1890ff' }}>
                Войти
              </Link>
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#666' }}>
              ← Вернуться на главную
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
