import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  Tag
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  jobData?: any; // Данные для редактирования
}

interface JobFormData {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  job_type: string;
  experience_level: string;
  location?: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  is_ai_interview_enabled: boolean;
  max_candidates: number;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  visible,
  onClose,
  onSuccess,
  jobData
}) => {
  const [form] = Form.useForm();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Загружаем данные при редактировании
  React.useEffect(() => {
    if (visible && jobData) {
      form.setFieldsValue({
        ...jobData,
        required_skills: jobData.required_skills || [],
        nice_to_have_skills: jobData.nice_to_have_skills || []
      });
    } else if (visible && !jobData) {
      form.resetFields();
    }
  }, [visible, jobData, form]);

  const handleSubmit = async (values: JobFormData) => {
    try {
      setLoading(true);
      
      const submitData = {
        ...values,
        required_skills: values.required_skills || [],
        nice_to_have_skills: values.nice_to_have_skills || []
      };

      if (jobData) {
        // Редактирование существующей вакансии
        await authAPI.updateJob(jobData.id.toString(), submitData);
        showSuccess({
          title: 'Вакансия обновлена',
          message: 'Вакансия успешно обновлена'
        });
      } else {
        // Создание новой вакансии
        await authAPI.createJob(submitData);
        showSuccess({
          title: 'Вакансия создана',
          message: 'Вакансия успешно создана и сохранена как черновик'
        });
      }
      
      form.resetFields();
      onClose();
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Ошибка сохранения вакансии:', error);
      showError({
        title: 'Ошибка сохранения',
        message: error.response?.data?.detail || 'Не удалось сохранить вакансию'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setPreviewMode(false);
    onClose();
  };

  const renderForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        job_type: 'full_time',
        experience_level: 'middle',
        is_remote: false,
        salary_currency: 'KGS',
        is_ai_interview_enabled: true,
        max_candidates: 100,
        required_skills: [],
        nice_to_have_skills: []
      }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="title"
            label="Название вакансии"
            rules={[{ required: true, message: 'Введите название вакансии' }]}
          >
            <Input placeholder="Например: Senior Frontend Developer" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="job_type"
            label="Тип занятости"
            rules={[{ required: true, message: 'Выберите тип занятости' }]}
          >
            <Select>
              <Option value="full_time">Полная занятость</Option>
              <Option value="part_time">Частичная занятость</Option>
              <Option value="contract">Контракт</Option>
              <Option value="internship">Стажировка</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="experience_level"
            label="Уровень опыта"
            rules={[{ required: true, message: 'Выберите уровень опыта' }]}
          >
            <Select>
              <Option value="intern">Стажер</Option>
              <Option value="junior">Junior</Option>
              <Option value="middle">Middle</Option>
              <Option value="senior">Senior</Option>
              <Option value="lead">Lead</Option>
              <Option value="principal">Principal</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="Описание вакансии"
        rules={[{ required: true, message: 'Введите описание вакансии' }]}
      >
        <TextArea 
          rows={4} 
          placeholder="Опишите основные задачи и возможности позиции..."
        />
      </Form.Item>

      <Form.Item
        name="requirements"
        label="Требования"
      >
        <TextArea 
          rows={3} 
          placeholder="Опишите обязательные требования к кандидату..."
        />
      </Form.Item>

      <Form.Item
        name="responsibilities"
        label="Обязанности"
      >
        <TextArea 
          rows={3} 
          placeholder="Опишите основные обязанности на позиции..."
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="location"
            label="Локация"
          >
            <Input placeholder="Например: Бишкек, Кыргызстан" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="is_remote"
            label="Удаленная работа"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="salary_min"
            label="Минимальная зарплата"
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="salary_max"
            label="Максимальная зарплата"
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="0"
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="salary_currency"
            label="Валюта"
          >
            <Select>
              <Option value="KGS">KGS (сом)</Option>
              <Option value="USD">USD (доллар)</Option>
              <Option value="EUR">EUR (евро)</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="required_skills"
        label="Обязательные навыки"
      >
        <Form.List name="required_skills">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[{ required: true, message: 'Введите навык' }]}
                  >
                    <Input placeholder="Например: React, Python, SQL" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Добавить навык
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        name="nice_to_have_skills"
        label="Желательные навыки"
      >
        <Form.List name="nice_to_have_skills">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[{ required: true, message: 'Введите навык' }]}
                  >
                    <Input placeholder="Например: Docker, AWS, GraphQL" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Добавить навык
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="is_ai_interview_enabled"
            label="AI-интервью"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Text type="secondary">
            Включить автоматическое AI-интервью для кандидатов
          </Text>
        </Col>
        <Col span={12}>
          <Form.Item
            name="max_candidates"
            label="Максимум кандидатов"
          >
            <InputNumber 
              style={{ width: '100%' }}
              min={1}
              max={1000}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  const renderPreview = () => {
    const values = form.getFieldsValue();
    
    return (
      <div>
        <Title level={3}>{values.title || 'Название вакансии'}</Title>
        
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Text strong>Тип занятости:</Text>
            <br />
            <Tag color="blue">
              {values.job_type === 'full_time' ? 'Полная занятость' :
               values.job_type === 'part_time' ? 'Частичная занятость' :
               values.job_type === 'contract' ? 'Контракт' : 'Стажировка'}
            </Tag>
          </Col>
          <Col span={8}>
            <Text strong>Уровень:</Text>
            <br />
            <Tag color="green">
              {values.experience_level === 'intern' ? 'Стажер' :
               values.experience_level === 'junior' ? 'Junior' :
               values.experience_level === 'middle' ? 'Middle' :
               values.experience_level === 'senior' ? 'Senior' :
               values.experience_level === 'lead' ? 'Lead' : 'Principal'}
            </Tag>
          </Col>
          <Col span={8}>
            <Text strong>Локация:</Text>
            <br />
            <Tag color="orange">
              {values.is_remote ? 'Удаленно' : values.location || 'Не указано'}
            </Tag>
          </Col>
        </Row>

        {values.salary_min || values.salary_max ? (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Зарплата:</Text>
            <br />
            <Tag color="gold">
              {values.salary_min && values.salary_max 
                ? `${values.salary_min} - ${values.salary_max} ${values.salary_currency}`
                : values.salary_min 
                  ? `от ${values.salary_min} ${values.salary_currency}`
                  : `до ${values.salary_max} ${values.salary_currency}`}
            </Tag>
          </div>
        ) : null}

        {values.description && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Описание:</Text>
            <p>{values.description}</p>
          </div>
        )}

        {values.requirements && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Требования:</Text>
            <p>{values.requirements}</p>
          </div>
        )}

        {values.responsibilities && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Обязанности:</Text>
            <p>{values.responsibilities}</p>
          </div>
        )}

        {values.required_skills && values.required_skills.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Обязательные навыки:</Text>
            <br />
            {values.required_skills.map((skill: string, index: number) => (
              <Tag key={index} color="red">{skill}</Tag>
            ))}
          </div>
        )}

        {values.nice_to_have_skills && values.nice_to_have_skills.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Желательные навыки:</Text>
            <br />
            {values.nice_to_have_skills.map((skill: string, index: number) => (
              <Tag key={index} color="blue">{skill}</Tag>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Text strong>Настройки:</Text>
          <br />
          <Tag color={values.is_ai_interview_enabled ? 'green' : 'red'}>
            AI-интервью: {values.is_ai_interview_enabled ? 'Включено' : 'Отключено'}
          </Tag>
          <Tag color="purple">
            Макс. кандидатов: {values.max_candidates}
          </Tag>
        </div>
      </div>
    );
  };

  return (
    <Modal
      className="create-job-modal"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {jobData ? <EditOutlined /> : <PlusOutlined />}
          {previewMode 
            ? 'Предварительный просмотр вакансии' 
            : jobData 
              ? 'Редактировать вакансию' 
              : 'Создать новую вакансию'
          }
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleCancel} className="modal-cancel-btn">
          Отмена
        </Button>,
        <Button 
          key="preview" 
          icon={<EyeOutlined />}
          onClick={() => setPreviewMode(!previewMode)}
          className="modal-preview-btn"
        >
          {previewMode ? 'Редактировать' : 'Предпросмотр'}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={() => {
            if (previewMode) {
              setPreviewMode(false);
            } else {
              form.submit();
            }
          }}
          className="modal-submit-btn"
        >
          {previewMode 
            ? 'Редактировать' 
            : jobData 
              ? 'Сохранить изменения' 
              : 'Создать вакансию'
          }
        </Button>
      ]}
    >
      <div className="create-job-modal-content">
        {previewMode ? renderPreview() : renderForm()}
      </div>
    </Modal>
  );
};

export default CreateJobModal;
