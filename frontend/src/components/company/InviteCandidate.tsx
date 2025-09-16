import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Space, 
  message, 
  Typography,
  Divider,
  Card,
  Switch,
  InputNumber
} from 'antd';
import { 
  MailOutlined, 
  LinkOutlined, 
  CalendarOutlined, 
  UserOutlined,
  SendOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface InviteCandidateProps {
  visible: boolean;
  onClose: () => void;
  jobId?: string;
  jobTitle?: string;
}

interface InviteFormData {
  candidate_email: string;
  candidate_name?: string;
  message?: string;
  deadline_hours: number;
  send_via: 'email' | 'link' | 'both';
  job_position: string;
  company_name: string;
  custom_questions?: string[];
  include_cv_analysis: boolean;
  include_technical_assessment: boolean;
}

const InviteCandidate: React.FC<InviteCandidateProps> = ({ 
  visible, 
  onClose, 
  jobId, 
  jobTitle 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (values: InviteFormData) => {
    setLoading(true);
    try {
      // Здесь будет API вызов для отправки приглашения
      console.log('Invite data:', values);
      
      // Генерируем mock ссылку
      const mockLink = `https://recruit.ai/interview/invite/${Date.now()}`;
      setInviteLink(mockLink);
      
      if (values.send_via === 'email' || values.send_via === 'both') {
        message.success(`Приглашение отправлено на ${values.candidate_email}`);
      }
      
      if (values.send_via === 'link' || values.send_via === 'both') {
        message.info('Ссылка для приглашения сгенерирована');
      }
      
    } catch (error) {
      message.error('Ошибка при отправке приглашения');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    message.success('Ссылка скопирована в буфер обмена');
  };

  const handleReset = () => {
    form.resetFields();
    setInviteLink('');
    setShowAdvanced(false);
  };

  return (
    <Modal
      title="Пригласить кандидата на интервью"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      className="invite-candidate-modal"
      styles={{
        content: {
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        },
        header: {
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px 16px 0 0'
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          deadline_hours: 48,
          send_via: 'email',
          job_position: jobTitle || '',
          company_name: 'Ваша компания',
          include_cv_analysis: true,
          include_technical_assessment: true
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Основная информация</Title>
          
          <Form.Item
            name="candidate_email"
            label="Email кандидата"
            rules={[
              { required: true, message: 'Введите email кандидата' },
              { type: 'email', message: 'Введите корректный email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="candidate@example.com"
              size="large"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              name="candidate_email_input"
            />
          </Form.Item>

          <Form.Item
            name="candidate_name"
            label="Имя кандидата (опционально)"
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Иван Иванов"
              size="large"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              name="candidate_name_input"
            />
          </Form.Item>

          <Form.Item
            name="job_position"
            label="Позиция"
            rules={[{ required: true, message: 'Укажите позицию' }]}
          >
            <Input 
              placeholder="Senior Frontend Developer"
              size="large"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              name="job_position_input"
            />
          </Form.Item>

          <Form.Item
            name="company_name"
            label="Название компании"
            rules={[{ required: true, message: 'Укажите название компании' }]}
          >
            <Input 
              placeholder="ООО 'Технологии будущего'"
              size="large"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              name="company_name_input"
            />
          </Form.Item>
        </div>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Настройки интервью</Title>
          
          <Form.Item
            name="deadline_hours"
            label="Срок действия приглашения (часы)"
            rules={[{ required: true, message: 'Укажите срок действия' }]}
          >
            <InputNumber
              min={1}
              max={168}
              style={{ width: '100%' }}
              size="large"
              addonAfter="часов"
            />
          </Form.Item>

          <Form.Item
            name="send_via"
            label="Способ отправки"
            rules={[{ required: true, message: 'Выберите способ отправки' }]}
          >
            <Select size="large">
              <Option value="email">Только email</Option>
              <Option value="link">Только ссылка</Option>
              <Option value="both">Email + ссылка</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Дополнительное сообщение (опционально)"
          >
            <TextArea 
              rows={3} 
              placeholder="Добавьте персональное сообщение для кандидата..."
              maxLength={500}
              showCount
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              name="message_input"
            />
          </Form.Item>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Button 
            type="link" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ 
              paddingLeft: 0,
              color: 'rgba(168, 237, 234, 0.9)'
            }}
          >
            {showAdvanced ? '- Скрыть' : '+ Показать'} дополнительные настройки
          </Button>
        </div>

        {showAdvanced && (
          <Card style={{ 
            marginBottom: 24, 
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          }}>
            <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Дополнительные настройки</Title>
            
            <Form.Item
              name="include_cv_analysis"
              valuePropName="checked"
            >
              <Switch /> 
              <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.8)' }}>Включить анализ резюме</span>
            </Form.Item>

            <Form.Item
              name="include_technical_assessment"
              valuePropName="checked"
            >
              <Switch /> 
              <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.8)' }}>Включить техническую оценку</span>
            </Form.Item>

            <Form.Item
              name="custom_questions"
              label="Дополнительные вопросы (по одному на строку)"
            >
              <TextArea 
                rows={4}
                placeholder="Расскажите о вашем опыте с React&#10;Какие проекты вас больше всего вдохновляют?&#10;Опишите ваш идеальный рабочий процесс"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                name="custom_questions_input"
              />
            </Form.Item>
          </Card>
        )}

        {inviteLink && (
          <Card style={{ 
            marginBottom: 24, 
            background: 'rgba(82, 196, 26, 0.1)',
            border: '1px solid rgba(82, 196, 26, 0.3)',
            borderRadius: '12px'
          }}>
            <Title level={5} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Ссылка для приглашения</Title>
            <Space style={{ width: '100%' }}>
              <Input 
                value={inviteLink} 
                readOnly 
                style={{ flex: 1 }}
                prefix={<LinkOutlined />}
              />
              <Button 
                type="primary" 
                icon={<LinkOutlined />}
                onClick={handleCopyLink}
              >
                Копировать
              </Button>
            </Space>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleReset} 
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            Сбросить
          </Button>
          <Button 
            onClick={onClose} 
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            Отмена
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SendOutlined />}
            size="large"
            style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              color: '#1a1a2e',
              fontWeight: 600
            }}
          >
            Отправить приглашение
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default InviteCandidate;
