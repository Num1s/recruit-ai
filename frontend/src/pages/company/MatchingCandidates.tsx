import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Avatar,
  Tag,
  Space,
  Row,
  Col,
  Input,
  Select,
  Slider,
  Divider,
  Badge,
  Tooltip,
  Modal,
  Progress,
  Rate,
  List,
  Empty
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  EyeOutlined,
  SendOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { authAPI } from '../../services/api.ts';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  matchScore?: number; // Добавляем поле для оценки соответствия
  avatar?: string; // Добавляем поле для аватара
  candidate_profile?: {
    experience_years?: number;
    skills?: string[] | string; // Может быть массивом или строкой
    education?: string;
    current_position?: string;
    expected_salary_min?: number;
    expected_salary_max?: number;
    preferred_salary_min?: number; // Добавляем недостающие поля
    preferred_salary_max?: number; // Добавляем недостающие поля
    availability?: string;
    preferred_locations?: string[] | string; // Может быть массивом или строкой
    languages?: string;
    achievements?: string;
    cv_url?: string;
    cv_filename?: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

const MatchingCandidates: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 10]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500000]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('matchScore');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      
      // Подготавливаем параметры для API
      const params: any = {
        skip: 0,
        limit: 50
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (selectedSkills.length > 0) {
        params.skills = selectedSkills.join(',');
      }

      if (experienceRange[0] > 0 || experienceRange[1] < 15) {
        params.experience_min = experienceRange[0];
        params.experience_max = experienceRange[1];
      }

      if (salaryRange[0] > 0 || salaryRange[1] < 500000) {
        params.salary_min = salaryRange[0];
        params.salary_max = salaryRange[1];
      }

      if (availabilityFilter !== 'all') {
        params.availability = availabilityFilter;
      }

      const response = await authAPI.getCandidates(params);
      setCandidates(response.data);
    } catch (error) {
      console.error('Ошибка загрузки кандидатов:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить список кандидатов'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSkillFilter = (skills: string[]) => {
    setSelectedSkills(skills);
  };


  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalVisible(true);
  };

  const handleSendInvitation = async (candidateId: number) => {
    try {
      await authAPI.inviteCandidate(candidateId);
      showSuccess({
        title: 'Приглашение отправлено',
        message: 'Кандидат получит уведомление о вашем предложении'
      });
    } catch (error) {
      console.error('Ошибка отправки приглашения:', error);
      showError({
        title: 'Ошибка отправки',
        message: 'Не удалось отправить приглашение'
      });
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'green';
      case 'busy': return 'orange';
      case 'not_looking': return 'red';
      default: return 'default';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Доступен';
      case 'busy': return 'Занят';
      case 'not_looking': return 'Не ищет работу';
      default: return availability;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#faad14';
    if (score >= 70) return '#fa8c16';
    return '#ff4d4f';
  };

  const filteredCandidates = candidates.filter(candidate => {
    const fullName = `${candidate.first_name} ${candidate.last_name}`;
    const candidateSkills = candidate.candidate_profile?.skills ? 
      (typeof candidate.candidate_profile.skills === 'string' 
        ? candidate.candidate_profile.skills.split(',').map(s => s.trim())
        : candidate.candidate_profile.skills) : [];
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidateSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.every(skill => candidateSkills.includes(skill));
    
    const experience = candidate.candidate_profile?.experience_years || 0;
    const matchesExperience = experience >= experienceRange[0] && 
                             experience <= experienceRange[1];
    
    const salaryMin = candidate.candidate_profile?.expected_salary_min || candidate.candidate_profile?.preferred_salary_min || 0;
    const salaryMax = candidate.candidate_profile?.expected_salary_max || candidate.candidate_profile?.preferred_salary_max || 0;
    const matchesSalary = salaryMin >= salaryRange[0] && 
                         salaryMax <= salaryRange[1];
    
    const availability = candidate.candidate_profile?.availability || 'available';
    const matchesAvailability = availabilityFilter === 'all' || 
                               availability === availabilityFilter;

    return matchesSearch && matchesSkills && matchesExperience && matchesSalary && matchesAvailability;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case 'experience':
        const expA = a.candidate_profile?.experience_years || 0;
        const expB = b.candidate_profile?.experience_years || 0;
        return expB - expA;
      case 'salary':
        const salaryA = a.candidate_profile?.expected_salary_max || 0;
        const salaryB = b.candidate_profile?.expected_salary_max || 0;
        return salaryB - salaryA;
      case 'name':
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return nameA.localeCompare(nameB);
      case 'lastActive':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      default:
        return 0;
    }
  });

  const allSkills = Array.from(new Set(candidates.flatMap(c => {
    if (!c.candidate_profile?.skills) return [];
    if (typeof c.candidate_profile.skills === 'string') {
      return c.candidate_profile.skills.split(',').map(s => s.trim());
    }
    return c.candidate_profile.skills;
  })));

  return (
    <div className="matching-candidates-container">
      <div className="matching-candidates-header">
        <div className="matching-candidates-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Button 
              icon={<UserOutlined />} 
              onClick={() => navigate('/company/dashboard')}
              className="matching-candidates-back-button"
            >
              Назад
            </Button>
            <Title level={2} className="matching-candidates-title" style={{ margin: 0 }}>
              Подходящие кандидаты
            </Title>
          </div>
          <Paragraph className="matching-candidates-subtitle">
            Найдите идеальных кандидатов для ваших вакансий с помощью AI-подбора
          </Paragraph>
        </div>
      </div>

      <div className="matching-candidates-content">
        <Row gutter={[24, 24]}>
          {/* Фильтры */}
          <Col xs={24} lg={6}>
            <Card className="matching-candidates-filters-card">
              <Title level={4} className="matching-candidates-filters-title">Фильтры</Title>
              
              <div className="matching-candidates-filter-section">
                <Text strong>Поиск</Text>
                <Search
                  placeholder="Имя или навыки"
                  onSearch={handleSearch}
                  className="matching-candidates-search"
                />
              </div>

              <Divider />

              <div className="matching-candidates-filter-section">
                <Text strong>Навыки</Text>
                <Select
                  mode="multiple"
                  placeholder="Выберите навыки"
                  value={selectedSkills}
                  onChange={handleSkillFilter}
                  className="matching-candidates-skills-select"
                  style={{ width: '100%' }}
                >
                  {allSkills.map(skill => (
                    <Option key={skill} value={skill}>{skill}</Option>
                  ))}
                </Select>
              </div>

              <Divider />

              <div className="matching-candidates-filter-section">
                <Text strong>Опыт работы: {experienceRange[0]} - {experienceRange[1]} лет</Text>
                <Slider
                  range
                  min={0}
                  max={15}
                  value={experienceRange}
                  onChange={(value) => setExperienceRange(value as [number, number])}
                  className="matching-candidates-slider"
                />
              </div>

              <Divider />

              <div className="matching-candidates-filter-section">
                <Text strong>Зарплата: {salaryRange[0].toLocaleString()} - {salaryRange[1].toLocaleString()} ₽</Text>
                <Slider
                  range
                  min={0}
                  max={500000}
                  step={10000}
                  value={salaryRange}
                  onChange={(value) => setSalaryRange(value as [number, number])}
                  className="matching-candidates-slider"
                />
              </div>

              <Divider />

              <div className="matching-candidates-filter-section">
                <Text strong>Доступность</Text>
                <Select
                  value={availabilityFilter}
                  onChange={setAvailabilityFilter}
                  className="matching-candidates-availability-select"
                  style={{ width: '100%' }}
                >
                  <Option value="all">Все</Option>
                  <Option value="available">Доступен</Option>
                  <Option value="busy">Занят</Option>
                  <Option value="not_looking">Не ищет работу</Option>
                </Select>
              </div>

              <Divider />

              <div className="matching-candidates-filter-section">
                <Text strong>Сортировка</Text>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="matching-candidates-sort-select"
                  style={{ width: '100%' }}
                >
                  <Option value="matchScore">По релевантности</Option>
                  <Option value="experience">По опыту</Option>
                  <Option value="salary">По зарплате</Option>
                  <Option value="lastActive">По активности</Option>
                </Select>
              </div>
            </Card>
          </Col>

          {/* Список кандидатов */}
          <Col xs={24} lg={18}>
            <Card className="matching-candidates-list-card">
              <div className="matching-candidates-list-header">
                <Title level={4} className="matching-candidates-list-title">
                  Найдено кандидатов: {sortedCandidates.length}
                </Title>
              </div>

              {loading ? (
                <div className="matching-candidates-loading">
                  <Progress type="circle" />
                </div>
              ) : sortedCandidates.length === 0 ? (
                <Empty
                  description="Кандидаты не найдены"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={sortedCandidates}
                  renderItem={(candidate) => (
                    <List.Item className="matching-candidates-list-item">
                      <Card className="matching-candidates-candidate-card">
                        <Row gutter={[16, 16]} align="middle">
                          <Col xs={24} sm={4} md={3}>
                            <div className="matching-candidates-avatar-section">
                              <Badge 
                                count={candidate.matchScore || 0} 
                                style={{ backgroundColor: getMatchScoreColor(candidate.matchScore || 0) }}
                                className="matching-candidates-match-badge"
                              >
                                <Avatar 
                                  size={64} 
                                  src={candidate.avatar}
                                  icon={<UserOutlined />}
                                  className="matching-candidates-avatar"
                                />
                              </Badge>
                            </div>
                          </Col>

                          <Col xs={24} sm={20} md={21}>
                            <div className="matching-candidates-candidate-info">
                              <div className="matching-candidates-candidate-header">
                                <div className="matching-candidates-candidate-name-section">
                                  <Title level={4} className="matching-candidates-candidate-name">
                                    {candidate.first_name} {candidate.last_name}
                                  </Title>
                                  <Tag color={getAvailabilityColor(candidate.candidate_profile?.availability || 'available')}>
                                    {getAvailabilityText(candidate.candidate_profile?.availability || 'available')}
                                  </Tag>
                                </div>
                                <div className="matching-candidates-candidate-actions">
                                  <Tooltip title="Добавить в избранное">
                                    <Button
                                      type="text"
                                      icon={<HeartOutlined />}
                                      onClick={() => {
                                        // Логика добавления в избранное
                                      }}
                                      className="matching-candidates-favorite-btn"
                                    />
                                  </Tooltip>
                                </div>
                              </div>

                              <div className="matching-candidates-candidate-details">
                                <Space wrap>
                                  <Text className="matching-candidates-detail">
                                    <BookOutlined /> {candidate.candidate_profile?.current_position || 'Не указано'}
                                  </Text>
                                  <Text className="matching-candidates-detail">
                                    <TrophyOutlined /> {candidate.candidate_profile?.experience_years || 0} лет опыта
                                  </Text>
                                  <Text className="matching-candidates-detail">
                                    <EnvironmentOutlined /> {candidate.candidate_profile?.preferred_locations || 'Не указано'}
                                  </Text>
                                  <Text className="matching-candidates-detail">
                                    <CalendarOutlined /> {new Date(candidate.updated_at).toLocaleDateString('ru-RU')}
                                  </Text>
                                </Space>
                              </div>

                              <div className="matching-candidates-candidate-skills">
                                <Text strong>Навыки: </Text>
                                <Space wrap>
                                  {(() => {
                                    if (!candidate.candidate_profile?.skills) return [];
                                    const skills = typeof candidate.candidate_profile.skills === 'string' 
                                      ? candidate.candidate_profile.skills.split(',').map(s => s.trim())
                                      : candidate.candidate_profile.skills;
                                    return skills.slice(0, 5).map(skill => (
                                      <Tag key={skill} className="matching-candidates-skill-tag">
                                        {skill}
                                      </Tag>
                                    ));
                                  })()}
                                  {(() => {
                                    if (!candidate.candidate_profile?.skills) return null;
                                    const skills = typeof candidate.candidate_profile.skills === 'string' 
                                      ? candidate.candidate_profile.skills.split(',').map(s => s.trim())
                                      : candidate.candidate_profile.skills;
                                    if (skills.length > 5) {
                                      return (
                                        <Tag className="matching-candidates-skill-tag">
                                          +{skills.length - 5} еще
                                        </Tag>
                                      );
                                    }
                                    return null;
                                  })()}
                                </Space>
                              </div>

                              <div className="matching-candidates-candidate-salary">
                                <Text strong>Ожидаемая зарплата: </Text>
                                <Text className="matching-candidates-salary">
                                  {(candidate.candidate_profile?.expected_salary_min || candidate.candidate_profile?.preferred_salary_min || 0).toLocaleString()} - {(candidate.candidate_profile?.expected_salary_max || candidate.candidate_profile?.preferred_salary_max || 0).toLocaleString()} ₽
                                </Text>
                              </div>

                              <div className="matching-candidates-candidate-stats">
                                <Space>
                                  <Text className="matching-candidates-stat">
                                    <EyeOutlined /> Профиль обновлен {new Date(candidate.updated_at).toLocaleDateString('ru-RU')}
                                  </Text>
                                  <Text className="matching-candidates-stat">
                                    <SendOutlined /> {candidate.email}
                                  </Text>
                                </Space>
                              </div>

                              <div className="matching-candidates-candidate-actions-bottom">
                                <Space>
                                  <Button 
                                    type="primary" 
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewProfile(candidate)}
                                    className="matching-candidates-view-btn"
                                  >
                                    Посмотреть профиль
                                  </Button>
                                  <Button 
                                    icon={<SendOutlined />}
                                    onClick={() => handleSendInvitation(candidate.id)}
                                    className="matching-candidates-invite-btn"
                                  >
                                    Отправить приглашение
                                  </Button>
                                </Space>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Модальное окно с детальной информацией о кандидате */}
      <Modal
        title={
          <div className="matching-candidates-modal-header">
            <Avatar size={48} src={selectedCandidate?.avatar_url} icon={<UserOutlined />} />
            <div>
              <Title level={4} style={{ margin: 0, marginLeft: 12 }}>
                {selectedCandidate?.first_name} {selectedCandidate?.last_name}
              </Title>
              <Text type="secondary">{selectedCandidate?.candidate_profile?.current_position || 'Не указано'}</Text>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
          <Button 
            key="invite" 
            type="primary" 
            icon={<SendOutlined />}
            onClick={() => {
              if (selectedCandidate) {
                handleSendInvitation(selectedCandidate.id);
                setModalVisible(false);
              }
            }}
          >
            Отправить приглашение
          </Button>
        ]}
        width={800}
        className="matching-candidates-modal"
      >
        {selectedCandidate && (
          <div className="matching-candidates-modal-content">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={5}>Контактная информация</Title>
                <Space direction="vertical">
                  <Text><MailOutlined /> {selectedCandidate.email}</Text>
                  <Text><PhoneOutlined /> {selectedCandidate.phone || 'Не указано'}</Text>
                  <Text><EnvironmentOutlined /> {selectedCandidate.candidate_profile?.preferred_locations || 'Не указано'}</Text>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Образование</Title>
                <Text>{selectedCandidate.candidate_profile?.education || 'Не указано'}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>Навыки</Title>
                <Space wrap>
                  {(() => {
                    if (!selectedCandidate.candidate_profile?.skills) return [];
                    const skills = typeof selectedCandidate.candidate_profile.skills === 'string' 
                      ? selectedCandidate.candidate_profile.skills.split(',').map(s => s.trim())
                      : selectedCandidate.candidate_profile.skills;
                    return skills.map(skill => (
                      <Tag key={skill} className="matching-candidates-skill-tag">
                        {skill}
                      </Tag>
                    ));
                  })()}
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Достижения</Title>
                <Text>{selectedCandidate.candidate_profile?.achievements || 'Не указано'}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>Языки</Title>
                <Text>{selectedCandidate.candidate_profile?.languages || 'Не указано'}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MatchingCandidates;
