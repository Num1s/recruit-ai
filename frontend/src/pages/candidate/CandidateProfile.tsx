import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Avatar,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  Descriptions,
  Spin,
  Alert,
  Tabs
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  BookOutlined,
  TrophyOutlined,
  LinkOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth, User, CandidateProfile } from '../../contexts/AuthContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';
import ProfileEditForm from '../../components/candidate/ProfileEditForm.tsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;


const CandidateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<User | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCandidateProfile();
      setProfileData(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки профиля:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить профиль'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = () => {
    setEditing(false);
    loadProfile(); // Перезагружаем данные
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Не указано';
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ₽`;
    } else if (min) {
      return `от ${min.toLocaleString()} ₽`;
    } else {
      return `до ${max!.toLocaleString()} ₽`;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Загружаем профиль...</Text>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Alert
          message="Профиль не найден"
          description="Не удалось загрузить информацию о профиле"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const profile = profileData.candidate_profile;

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/candidate/dashboard')}
          className="ant-btn"
        >
          Назад к дашборду
        </Button>
        
        <div className="profile-hero">
          <Title level={2} className="section-title">
            Профиль кандидата
          </Title>
        </div>
      </div>

      <div className="profile-content">
        {editing ? (
          <Card className="section-content">
            <ProfileEditForm
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Card>
        ) : (
          <Tabs defaultActiveKey="overview" className="profile-tabs">
            <TabPane tab="Обзор" key="overview">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card className="section-content">
                    <div className="profile-header">
                      <Avatar
                        size={120}
                        src={profileData.avatar_url}
                        icon={<UserOutlined />}
                        className="profile-avatar"
                      />
                      <div className="profile-basic-info">
                        <Title level={3} className="profile-name">
                          {profileData.first_name} {profileData.last_name}
                        </Title>
                        {profile?.current_position && (
                          <Text className="profile-position">
                            {profile.current_position}
                          </Text>
                        )}
                        {profile?.current_company && (
                          <Text type="secondary" className="profile-company">
                            {profile.current_company}
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="profile-actions">
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        size="large"
                        block
                      >
                        Редактировать профиль
                      </Button>
                    </div>

                    <Divider />

                    <div className="contact-info">
                      <div className="contact-item">
                        <MailOutlined className="contact-icon" />
                        <Text>{profileData.email}</Text>
                      </div>
                      {profileData.phone && (
                        <div className="contact-item">
                          <PhoneOutlined className="contact-icon" />
                          <Text>{profileData.phone}</Text>
                        </div>
                      )}
                      {profile?.location && (
                        <div className="contact-item">
                          <EnvironmentOutlined className="contact-icon" />
                          <Text>{profile.location}</Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} lg={16}>
                  <Card title="О себе" className="section-content">
                    {profile?.summary ? (
                      <Paragraph className="profile-summary">
                        {profile.summary}
                      </Paragraph>
                    ) : (
                      <Text type="secondary">Информация о себе не указана</Text>
                    )}
                  </Card>

                  <Card title="Профессиональная информация" className="section-content">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Опыт работы">
                        {profile?.experience_years ? `${profile.experience_years} лет` : 'Не указано'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Образование">
                        {profile?.education || 'Не указано'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Желаемая зарплата">
                        {formatSalary(profile?.preferred_salary_min, profile?.preferred_salary_max)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {profile?.skills && profile.skills.length > 0 && (
                    <Card title="Навыки" className="section-content">
                      <div className="skills-container">
                        {profile.skills.map((skill, index) => (
                          <Tag key={index} className="ant-tag">
                            {skill}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  )}

                  {profile?.preferred_locations && profile.preferred_locations.length > 0 && (
                    <Card title="Предпочитаемые локации" className="section-content">
                      <div className="locations-container">
                        {profile.preferred_locations.map((location, index) => (
                          <Tag key={index} className="ant-tag">
                            {location}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  )}

                  {profile?.languages && profile.languages.length > 0 && (
                    <Card title="Языки" className="section-content">
                      <div className="languages-container">
                        {profile.languages.map((language, index) => (
                          <Tag key={index} className="ant-tag">
                            {language}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  )}

                  {profile?.achievements && (
                    <Card title="Достижения" className="section-content">
                      <Paragraph className="profile-achievements">
                        {profile.achievements}
                      </Paragraph>
                    </Card>
                  )}

                  <Card title="Контакты и портфолио" className="section-content">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {profile?.linkedin_url && (
                        <div className="social-link">
                          <LinkOutlined className="social-icon" />
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                          </a>
                        </div>
                      )}
                      {profile?.github_url && (
                        <div className="social-link">
                          <LinkOutlined className="social-icon" />
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                            GitHub
                          </a>
                        </div>
                      )}
                      {profile?.portfolio_url && (
                        <div className="social-link">
                          <LinkOutlined className="social-icon" />
                          <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                            Портфолио
                          </a>
                        </div>
                      )}
                      {profile?.cv_filename && (
                        <div className="cv-info">
                          <FileTextOutlined className="cv-icon" />
                          <Text strong>Резюме: </Text>
                          <Text>{profile.cv_filename}</Text>
                          <br />
                          <Text type="secondary">
                            Загружено: {new Date(profile.cv_uploaded_at || '').toLocaleDateString('ru-RU')}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CandidateProfilePage;


