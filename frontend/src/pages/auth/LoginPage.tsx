import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Если пользователь уже авторизован, редиректим
    if (user) {
      const redirectPath = user.role === 'candidate' ? '/candidate/dashboard' : '/company/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      // Редирект происходит автоматически через useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-form">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} className="auth-title">
            Recruit.ai
          </Title>
          <Text className="auth-subtitle">Войдите в свой аккаунт</Text>
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
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Ваш пароль"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={!loading && <LoginOutlined />}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </Form.Item>

          <div className="auth-link">
            <Text>
              Нет аккаунта?{' '}
              <Link to="/register">
                Зарегистрироваться
              </Link>
            </Text>
          </div>

          <div className="auth-link" style={{ marginTop: 16 }}>
            <Link to="/">
              ← Вернуться на главную
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
