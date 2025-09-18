import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Select,
  InputNumber,
  Upload,
  Avatar,
  Typography,
  Space,
  Divider,
  message,
  Spin,
  Tag
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  SaveOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  BookOutlined,
  TrophyOutlined,
  LinkOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth, User, CandidateProfile } from '../../contexts/AuthContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;


interface ProfileEditFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ onSave, onCancel }) => {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (user?.candidate_profile) {
      const profile = user.candidate_profile;
      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        summary: profile.summary,
        experience_years: profile.experience_years,
        current_position: profile.current_position,
        current_company: profile.current_company,
        location: profile.location,
        preferred_salary_min: profile.preferred_salary_min,
        preferred_salary_max: profile.preferred_salary_max,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        education: profile.education,
        achievements: profile.achievements,
      });

      setSkills(profile.skills || []);
      setPreferredLocations(profile.preferred_locations || []);
      setLanguages(profile.languages || []);
    }
  }, [user, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Подготавливаем данные профиля
      const profileData = {
        summary: values.summary,
        experience_years: values.experience_years,
        current_position: values.current_position,
        current_company: values.current_company,
        location: values.location,
        skills: skills,
        preferred_salary_min: values.preferred_salary_min,
        preferred_salary_max: values.preferred_salary_max,
        preferred_locations: preferredLocations,
        linkedin_url: values.linkedin_url,
        github_url: values.github_url,
        portfolio_url: values.portfolio_url,
        education: values.education,
        languages: languages,
        achievements: values.achievements,
      };

      // Обновляем профиль кандидата
      await authAPI.updateCandidateProfile(profileData);

      // Обновляем основную информацию пользователя
      const userData = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
      };

      await authAPI.updateUserProfile(userData);

      showSuccess({
        title: 'Профиль обновлен',
        message: 'Ваш профиль успешно сохранен'
      });

      // Обновляем контекст пользователя
      if (user) {
        const updatedUser: User = {
          ...user,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          candidate_profile: user.candidate_profile ? {
            ...user.candidate_profile,
            ...profileData
          } : undefined
        };
        setUser(updatedUser);
      }

      onSave?.();
    } catch (error: any) {
      console.error('Ошибка сохранения профиля:', error);
      showError({
        title: 'Ошибка сохранения',
        message: 'Не удалось сохранить профиль. Попробуйте еще раз.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (file: File) => {
    try {
      setUploadingCV(true);
      const response = await authAPI.uploadCV(file);
      
      showSuccess({
        title: 'Резюме загружено',
        message: 'Ваше резюме успешно загружено'
      });

      // Обновляем информацию о резюме в форме
      if (user?.candidate_profile) {
        const updatedProfile: CandidateProfile = {
          ...user.candidate_profile,
          cv_filename: response.data.filename,
          cv_url: response.data.cv_url,
          cv_uploaded_at: response.data.uploaded_at
        };
        
        const updatedUser: User = {
          ...user,
          candidate_profile: updatedProfile
        };
        setUser(updatedUser);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки резюме:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить резюме. Проверьте формат файла.'
      });
    } finally {
      setUploadingCV(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const response = await authAPI.uploadAvatar(file);
      
      showSuccess({
        title: 'Аватар обновлен',
        message: 'Ваш аватар успешно загружен'
      });

      // Обновляем аватар в контексте
      if (user) {
        const updatedUser: User = {
          ...user,
          avatar_url: response.data.avatar_url
        };
        setUser(updatedUser);
      }
    } catch (error: any) {
      console.error('Ошибка загрузки аватара:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить аватар. Проверьте формат файла.'
      });
    } finally {
      setUploadingAvatar(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== location));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setLanguages(languages.filter(l => l !== language));
  };

  return (
    <div className="profile-edit-form">
      <Form
        form={form}
        layout="vertical"
        size="large"
        className="auth-form"
      >
        {/* Основная информация */}
        <Card title="Основная информация" className="section-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="first_name"
                label="Имя"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Ваше имя" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_name"
                label="Фамилия"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Ваша фамилия" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Введите корректный email' }
                ]}
              >
                <Input disabled placeholder="your@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Телефон"
              >
                <Input placeholder="+7 (999) 123-45-67" />
              </Form.Item>
            </Col>
          </Row>

          {/* Аватар */}
          <div className="avatar-section">
            <Text strong>Аватар</Text>
            <div className="avatar-upload">
              <Avatar
                size={100}
                src={user?.avatar_url}
                icon={<UserOutlined />}
                className="profile-avatar"
              />
              <Upload
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploadingAvatar}
                  className="ant-btn-primary"
                >
                  {uploadingAvatar ? 'Загружаем...' : 'Изменить аватар'}
                </Button>
              </Upload>
            </div>
          </div>
        </Card>

        {/* Профессиональная информация */}
        <Card title="Профессиональная информация" className="section-content">
          <Form.Item
            name="summary"
            label="О себе"
          >
            <TextArea
              rows={4}
              placeholder="Расскажите о себе, своих профессиональных целях и достижениях..."
            />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="experience_years"
                label="Опыт работы (лет)"
              >
                <InputNumber
                  min={0}
                  max={50}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="current_position"
                label="Текущая должность"
              >
                <Input placeholder="Frontend Developer" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="current_company"
                label="Текущая компания"
              >
                <Input placeholder="Название компании" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="location"
                label="Местоположение"
              >
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Москва, Россия"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Навыки */}
          <div className="skills-section">
            <Text strong>Навыки</Text>
            <div className="skills-container">
              {skills.map((skill, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => removeSkill(skill)}
                  className="ant-tag"
                >
                  {skill}
                </Tag>
              ))}
            </div>
            <div className="add-skill">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Добавить навык"
                onPressEnter={addSkill}
                style={{ width: '200px', marginRight: '8px' }}
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addSkill}
                disabled={!newSkill.trim()}
              >
                Добавить
              </Button>
            </div>
          </div>
        </Card>

        {/* Предпочтения по работе */}
        <Card title="Предпочтения по работе" className="section-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="preferred_salary_min"
                label="Желаемая зарплата (от)"
              >
                <InputNumber
                  min={0}
                  placeholder="50000"
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="preferred_salary_max"
                label="Желаемая зарплата (до)"
              >
                <InputNumber
                  min={0}
                  placeholder="100000"
                  style={{ width: '100%' }}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Предпочитаемые локации */}
          <div className="locations-section">
            <Text strong>Предпочитаемые локации</Text>
            <div className="locations-container">
              {preferredLocations.map((location, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => removeLocation(location)}
                  className="ant-tag"
                >
                  {location}
                </Tag>
              ))}
            </div>
            <div className="add-location">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Добавить локацию"
                onPressEnter={addLocation}
                style={{ width: '200px', marginRight: '8px' }}
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addLocation}
                disabled={!newLocation.trim()}
              >
                Добавить
              </Button>
            </div>
          </div>
        </Card>

        {/* Образование и достижения */}
        <Card title="Образование и достижения" className="section-content">
          <Form.Item
            name="education"
            label="Образование"
          >
            <Input placeholder="Высшее техническое образование" />
          </Form.Item>

          <Form.Item
            name="achievements"
            label="Достижения"
          >
            <TextArea
              rows={3}
              placeholder="Опишите ваши профессиональные достижения, награды, сертификаты..."
            />
          </Form.Item>

          {/* Языки */}
          <div className="languages-section">
            <Text strong>Языки</Text>
            <div className="languages-container">
              {languages.map((language, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => removeLanguage(language)}
                  className="ant-tag"
                >
                  {language}
                </Tag>
              ))}
            </div>
            <div className="add-language">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Добавить язык"
                onPressEnter={addLanguage}
                style={{ width: '200px', marginRight: '8px' }}
              />
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addLanguage}
                disabled={!newLanguage.trim()}
              >
                Добавить
              </Button>
            </div>
          </div>
        </Card>

        {/* Социальные сети */}
        <Card title="Социальные сети и портфолио" className="section-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="linkedin_url"
                label="LinkedIn"
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://linkedin.com/in/username"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="github_url"
                label="GitHub"
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://github.com/username"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="portfolio_url"
                label="Портфолио"
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://yourportfolio.com"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Резюме */}
        <Card title="Резюме" className="section-content">
          {user?.candidate_profile?.cv_filename && (
            <div className="current-cv">
              <Text strong>Текущее резюме: </Text>
              <Text>{user.candidate_profile.cv_filename}</Text>
              <br />
              <Text type="secondary">
                Загружено: {new Date(user.candidate_profile.cv_uploaded_at || '').toLocaleDateString('ru-RU')}
              </Text>
            </div>
          )}
          
          <Upload
            beforeUpload={handleCVUpload}
            showUploadList={false}
            accept=".pdf,.doc,.docx"
          >
            <Button
              icon={<FileTextOutlined />}
              loading={uploadingCV}
              className="ant-btn-primary"
            >
              {uploadingCV ? 'Загружаем...' : 'Загрузить резюме'}
            </Button>
          </Upload>
          <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
            Поддерживаемые форматы: PDF, DOC, DOCX (максимум 10 МБ)
          </Text>
        </Card>

        {/* Кнопки действий */}
        <div className="form-actions">
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              size="large"
            >
              Сохранить изменения
            </Button>
            {onCancel && (
              <Button onClick={onCancel} size="large">
                Отмена
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default ProfileEditForm;
