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
  List,
  Empty,
  Progress,
  Modal,
  message,
  Badge,
  Tooltip,
  Slider,
  Divider,
  Form
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  ImportOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  DollarOutlined,
  CalendarOutlined,
  LinkOutlined,
  GithubOutlined,
  LinkedinOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { authAPI } from '../../services/api.ts';
// import { CandidateSearchForm } from './index';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ExternalCandidate {
  id: number;
  external_id: string;
  platform: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  profile_url?: string;
  linkedin_url?: string;
  github_url?: string;
  current_position?: string;
  current_company?: string;
  experience_years?: number;
  location?: string;
  skills?: string | string[];
  summary?: string;
  salary_min?: number;
  salary_max?: number;
  is_imported: boolean;
  last_synced_at?: string;
  created_at: string;
}

interface ExternalCandidatesListProps {
  integrationId?: number;
}

const ExternalCandidatesList: React.FC<ExternalCandidatesListProps> = ({ integrationId }) => {
  const [candidates, setCandidates] = useState<ExternalCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [importedFilter, setImportedFilter] = useState<string>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 15]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 300000]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<ExternalCandidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [integrationId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      
      // Подготавливаем параметры для API
      const params: any = {
        limit: 100,
        offset: 0
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (platformFilter !== 'all') {
        params.platform = platformFilter;
      }

      if (importedFilter !== 'all') {
        params.is_imported = importedFilter === 'imported';
      }

      if (selectedSkills.length > 0) {
        params.skills = selectedSkills.join(',');
      }

      if (experienceRange[0] > 0 || experienceRange[1] < 15) {
        params.experience_min = experienceRange[0];
        params.experience_max = experienceRange[1];
      }

      if (salaryRange[0] > 0 || salaryRange[1] < 300000) {
        params.salary_min = salaryRange[0];
        params.salary_max = salaryRange[1];
      }

      if (locationFilter) {
        params.location = locationFilter;
      }

      console.log('Загружаем кандидатов с параметрами:', params);
      
      const response = await authAPI.getExternalCandidates(params);
      console.log('Ответ от API getExternalCandidates:', response.data);
      
      // Проверяем, что response.data является массивом
      const candidates = Array.isArray(response.data) ? response.data : [];
      setCandidates(candidates);
    } catch (error: any) {
      console.error('Ошибка загрузки кандидатов:', error);
      
      // Более детальная обработка ошибок
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.detail || 'Ошибка сервера';
        message.error(`Ошибка загрузки кандидатов: ${errorMessage}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        message.error(`Ошибка: ${error.message}`);
      }
      
      // Fallback к моковым данным в случае ошибки
      const mockCandidates: ExternalCandidate[] = [
        {
          id: 1,
          external_id: 'linkedin_12345',
          platform: 'linkedin',
          first_name: 'Алексей',
          last_name: 'Петров',
          email: 'alexey.petrov@email.com',
          phone: '+7 (999) 123-45-67',
          profile_url: 'https://linkedin.com/in/alexey-petrov',
          linkedin_url: 'https://linkedin.com/in/alexey-petrov',
          github_url: 'https://github.com/alexey-petrov',
          current_position: 'Senior Frontend Developer',
          current_company: 'TechCorp',
          experience_years: 5,
          location: 'Москва',
          skills: 'React, TypeScript, Node.js, Python, Docker',
          summary: 'Опытный разработчик с 5-летним стажем',
          salary_min: 150000,
          salary_max: 200000,
          is_imported: false,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          external_id: 'lalafo_101',
          platform: 'lalafo',
          first_name: 'Айбек',
          last_name: 'Абдылдаев',
          email: 'aibek.abdyl@example.com',
          phone: '+996 (555) 123-456',
          profile_url: 'https://lalafo.kg/profile/aibek-dev',
          current_position: 'Python Developer',
          current_company: 'Bishkek Tech',
          experience_years: 2,
          location: 'Бишкек',
          skills: 'Python, Django, JavaScript, HTML, CSS',
          summary: 'Молодой разработчик Python с опытом веб-разработки',
          salary_min: 80000,
          salary_max: 120000,
          is_imported: false,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ];
      
      setCandidates(mockCandidates);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCandidate = async (candidateId: number) => {
    try {
      setImporting(candidateId);
      
      const importData = {
        external_candidate_id: candidateId,
        create_internal_user: true,
        import_notes: `Импортирован из ${candidates.find(c => c.id === candidateId)?.platform}`
      };
      
      console.log('Импортируем кандидата:', importData);
      
      await authAPI.importCandidate(importData);
      
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, is_imported: true }
          : candidate
      ));
      
      message.success('Кандидат успешно импортирован');
    } catch (error: any) {
      console.error('Ошибка импорта кандидата:', error);
      
      // Более детальная обработка ошибок
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.detail || 'Ошибка сервера';
        message.error(`Ошибка импорта кандидата: ${errorMessage}`);
      } else if (error.request) {
        message.error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      } else {
        message.error(`Ошибка: ${error.message}`);
      }
    } finally {
      setImporting(null);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'blue';
      case 'hh_ru': return 'green';
      case 'superjob': return 'orange';
      case 'lalafo': return 'purple';
      default: return 'default';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'hh_ru': return 'HH.ru';
      case 'superjob': return 'SuperJob';
      case 'lalafo': return 'Лалафо';
      default: return platform;
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
                         fullName.includes(searchTerm.toLowerCase()) ||
                         candidate.current_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(candidate.skills) 
                           ? candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
                           : candidate.skills?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlatform = platformFilter === 'all' || candidate.platform === platformFilter;
    
    const matchesImported = importedFilter === 'all' || 
                           (importedFilter === 'imported' && candidate.is_imported) ||
                           (importedFilter === 'not_imported' && !candidate.is_imported);

    return matchesSearch && matchesPlatform && matchesImported;
  });

  const platforms = Array.from(new Set(candidates.map(c => c.platform)));

  const allSkills = Array.from(new Set(candidates.flatMap(c => {
    if (!c.skills) return [];
    // skills уже является массивом после исправления Pydantic схемы
    return Array.isArray(c.skills) ? c.skills : c.skills.split(',').map(s => s.trim());
  })));

  const handleSearchResults = (newCandidates: ExternalCandidate[]) => {
    setCandidates(newCandidates);
    setShowSearchForm(false);
  };

  const handleSearchLoading = (loading: boolean) => {
    setLoading(loading);
  };

  return (
    <div>
      {/* Форма поиска */}
      {showSearchForm && (
        <div style={{ marginBottom: 16 }}>
          <Card>
            <Title level={4}>Поиск кандидатов в интеграциях</Title>
            <Text type="secondary">
              Найдите подходящих кандидатов на внешних платформах LinkedIn и Lalafo
            </Text>
            
            <Form
              layout="vertical"
              onFinish={async (values) => {
                try {
                  setLoading(true);
                  
                  const searchParams = {
                    platform: values.platform,
                    keywords: values.keywords ? [values.keywords] : [],
                    locations: values.locations ? [values.locations] : [],
                    experience_min: values.experience_min,
                    experience_max: values.experience_max,
                    salary_min: values.salary_min,
                    salary_max: values.salary_max,
                    limit: values.limit || 50
                  };

                  console.log('Отправляем поиск кандидатов:', searchParams);
                  
                  const response = await authAPI.searchCandidates(searchParams);
                  console.log('Ответ от API:', response.data);
                  
                  // Проверяем, что response.data является массивом
                  const candidates = Array.isArray(response.data) ? response.data : [];
                  setCandidates(candidates);
                  setShowSearchForm(false);
                  
                  if (candidates.length > 0) {
                    message.success(`Найдено ${candidates.length} кандидатов`);
                  } else {
                    message.info('Кандидаты не найдены. Попробуйте изменить параметры поиска.');
                  }
                } catch (error: any) {
                  console.error('Ошибка поиска кандидатов:', error);
                  
                  // Более детальная обработка ошибок
                  if (error.response) {
                    // Сервер ответил с ошибкой
                    const errorMessage = error.response.data?.message || error.response.data?.detail || 'Ошибка сервера';
                    message.error(`Ошибка сервера: ${errorMessage}`);
                  } else if (error.request) {
                    // Запрос был отправлен, но ответа не получено
                    message.error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
                  } else {
                    // Что-то пошло не так при настройке запроса
                    message.error(`Ошибка: ${error.message}`);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              style={{ marginTop: 24 }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="platform"
                    label="Платформа"
                    rules={[{ required: true, message: 'Выберите платформу' }]}
                  >
                    <Select placeholder="Выберите платформу для поиска">
                      <Option value="linkedin">LinkedIn</Option>
                      <Option value="lalafo">Лалафо</Option>
                      <Option value="hh_ru">HH.ru</Option>
                      <Option value="superjob">SuperJob</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="limit"
                    label="Количество результатов"
                    initialValue={50}
                  >
                    <Select>
                      <Option value={10}>10</Option>
                      <Option value={25}>25</Option>
                      <Option value={50}>50</Option>
                      <Option value={100}>100</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="keywords"
                    label="Ключевые слова"
                  >
                    <Input placeholder="Например: Python, React, DevOps" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="locations"
                    label="Локации"
                  >
                    <Input placeholder="Например: Москва, Бишкек" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="experience_min"
                    label="Минимальный опыт (лет)"
                  >
                    <Select placeholder="Выберите минимальный опыт" allowClear>
                      <Option value={0}>Без опыта</Option>
                      <Option value={1}>1 год</Option>
                      <Option value={2}>2 года</Option>
                      <Option value={3}>3 года</Option>
                      <Option value={5}>5 лет</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="experience_max"
                    label="Максимальный опыт (лет)"
                  >
                    <Select placeholder="Выберите максимальный опыт" allowClear>
                      <Option value={2}>2 года</Option>
                      <Option value={3}>3 года</Option>
                      <Option value={5}>5 лет</Option>
                      <Option value={10}>10 лет</Option>
                      <Option value={15}>15+ лет</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="salary_min"
                    label="Минимальная зарплата (₽)"
                  >
                    <Input type="number" placeholder="Например: 100000" />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="salary_max"
                    label="Максимальная зарплата (₽)"
                  >
                    <Input type="number" placeholder="Например: 300000" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />} size="large">
                    Найти кандидатов
                  </Button>
                  <Button onClick={() => setShowSearchForm(false)}>
                    Отмена
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}

      {/* Кнопка для открытия формы поиска */}
      {!showSearchForm && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={() => setShowSearchForm(true)}
            size="large"
          >
            Найти новых кандидатов в интеграциях
          </Button>
        </div>
      )}
      {/* Основные фильтры */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Поиск по имени или навыкам"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={loadCandidates}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Платформа"
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Все платформы</Option>
              {platforms.map(platform => (
                <Option key={platform} value={platform}>
                  {getPlatformName(platform)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Статус импорта"
              value={importedFilter}
              onChange={setImportedFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Все</Option>
              <Option value="imported">Импортированы</Option>
              <Option value="not_imported">Не импортированы</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
              style={{ width: '100%' }}
            >
              {showFilters ? 'Скрыть фильтры' : 'Дополнительные фильтры'}
            </Button>
          </Col>
        </Row>

        {/* Расширенные фильтры */}
        {showFilters && (
          <>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Навыки</Text>
                <Select
                  mode="multiple"
                  placeholder="Выберите навыки"
                  value={selectedSkills}
                  onChange={setSelectedSkills}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {allSkills.map(skill => (
                    <Option key={skill} value={skill}>{skill}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Локация</Text>
                <Input
                  placeholder="Введите город"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Опыт работы: {experienceRange[0]} - {experienceRange[1]} лет</Text>
                <Slider
                  range
                  min={0}
                  max={15}
                  value={experienceRange}
                  onChange={(value) => setExperienceRange(value as [number, number])}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Зарплата: {salaryRange[0].toLocaleString()} - {salaryRange[1].toLocaleString()} ₽</Text>
                <Slider
                  range
                  min={0}
                  max={300000}
                  step={10000}
                  value={salaryRange}
                  onChange={(value) => setSalaryRange(value as [number, number])}
                  style={{ marginTop: 8 }}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col>
                <Space>
                  <Button type="primary" onClick={loadCandidates}>
                    Применить фильтры
                  </Button>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setPlatformFilter('all');
                    setImportedFilter('all');
                    setSelectedSkills([]);
                    setExperienceRange([0, 15]);
                    setSalaryRange([0, 300000]);
                    setLocationFilter('');
                    loadCandidates();
                  }}>
                    Сбросить
                  </Button>
                </Space>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Список кандидатов */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>
            Найдено кандидатов: {filteredCandidates.length}
          </Title>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Progress type="circle" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Empty
            description="Кандидаты не найдены"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={filteredCandidates}
            renderItem={(candidate) => (
              <List.Item>
                <Card style={{ width: '100%' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={4} md={3}>
                      <div style={{ textAlign: 'center' }}>
                        <Avatar 
                          size={64} 
                          icon={<UserOutlined />}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Tag color={getPlatformColor(candidate.platform)}>
                            {getPlatformName(candidate.platform)}
                          </Tag>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} sm={20} md={21}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <Title level={4} style={{ margin: 0 }}>
                              {candidate.first_name} {candidate.last_name}
                            </Title>
                            <Space wrap style={{ marginTop: 4 }}>
                              <Tag color={candidate.is_imported ? 'green' : 'orange'}>
                                {candidate.is_imported ? 'Импортирован' : 'Не импортирован'}
                              </Tag>
                              <Tag color={getPlatformColor(candidate.platform)}>
                                {getPlatformName(candidate.platform)}
                              </Tag>
                            </Space>
                          </div>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <Space wrap>
                            <Text>
                              <BankOutlined /> {candidate.current_position || 'Не указано'}
                            </Text>
                            <Text>
                              <EnvironmentOutlined /> {candidate.current_company || 'Не указано'}
                            </Text>
                            <Text>
                              <CalendarOutlined /> {candidate.experience_years || 0} лет опыта
                            </Text>
                            <Text>
                              <EnvironmentOutlined /> {candidate.location || 'Не указано'}
                            </Text>
                          </Space>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <Text strong>Навыки: </Text>
                          <Space wrap>
                            {(() => {
                              const skillsArray = Array.isArray(candidate.skills) 
                                ? candidate.skills 
                                : candidate.skills?.split(',').map(s => s.trim()) || [];
                              
                              return (
                                <>
                                  {skillsArray.slice(0, 5).map(skill => (
                                    <Tag key={skill}>
                                      {skill}
                                    </Tag>
                                  ))}
                                  {skillsArray.length > 5 && (
                                    <Tag>
                                      +{skillsArray.length - 5} еще
                                    </Tag>
                                  )}
                                </>
                              );
                            })()}
                          </Space>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <Text strong>Зарплата: </Text>
                          <Text>
                            {candidate.salary_min?.toLocaleString() || 0} - {candidate.salary_max?.toLocaleString() || 0} ₽
                          </Text>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <Space>
                            {candidate.email && (
                              <Text>
                                <MailOutlined /> {candidate.email}
                              </Text>
                            )}
                            {candidate.phone && (
                              <Text>
                                <PhoneOutlined /> {candidate.phone}
                              </Text>
                            )}
                            {candidate.last_synced_at && (
                              <Text>
                                <CalendarOutlined /> Синхронизирован {new Date(candidate.last_synced_at).toLocaleDateString('ru-RU')}
                              </Text>
                            )}
                          </Space>
                        </div>

                        <div>
                          <Space>
                            <Button 
                              type="primary" 
                              icon={<EyeOutlined />}
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setModalVisible(true);
                              }}
                            >
                              Подробнее
                            </Button>
                            {!candidate.is_imported && (
                              <Button 
                                type="default"
                                icon={<ImportOutlined />}
                                loading={importing === candidate.id}
                                onClick={() => handleImportCandidate(candidate.id)}
                              >
                                Импортировать
                              </Button>
                            )}
                            {candidate.profile_url && (
                              <Button 
                                icon={<LinkOutlined />}
                                onClick={() => window.open(candidate.profile_url, '_blank')}
                              >
                                Открыть профиль
                              </Button>
                            )}
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

      {/* Модальное окно с детальной информацией */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar size={48} icon={<UserOutlined />} />
            <div style={{ marginLeft: 12 }}>
              <Title level={4} style={{ margin: 0 }}>
                {selectedCandidate?.first_name} {selectedCandidate?.last_name}
              </Title>
              <Text type="secondary">{selectedCandidate?.current_position || 'Не указано'}</Text>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>,
          ...(!selectedCandidate?.is_imported ? [
            <Button 
              key="import" 
              type="primary" 
              icon={<ImportOutlined />}
              loading={importing === selectedCandidate?.id}
              onClick={() => {
                if (selectedCandidate) {
                  handleImportCandidate(selectedCandidate.id);
                  setModalVisible(false);
                }
              }}
            >
              Импортировать
            </Button>
          ] : []),
          ...(selectedCandidate?.profile_url ? [
            <Button 
              key="profile" 
              icon={<LinkOutlined />}
              onClick={() => window.open(selectedCandidate.profile_url, '_blank')}
            >
              Открыть профиль
            </Button>
          ] : [])
        ]}
        width={800}
      >
        {selectedCandidate && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={5}>Контактная информация</Title>
                <Space direction="vertical">
                  {selectedCandidate.email && <Text><MailOutlined /> {selectedCandidate.email}</Text>}
                  {selectedCandidate.phone && <Text><PhoneOutlined /> {selectedCandidate.phone}</Text>}
                  <Text><EnvironmentOutlined /> {selectedCandidate.location || 'Не указано'}</Text>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Профессиональная информация</Title>
                <Space direction="vertical">
                  <Text><BankOutlined /> Должность: {selectedCandidate.current_position || 'Не указано'}</Text>
                  <Text><EnvironmentOutlined /> Компания: {selectedCandidate.current_company || 'Не указано'}</Text>
                  <Text><CalendarOutlined /> Опыт: {selectedCandidate.experience_years || 0} лет</Text>
                  <Text><DollarOutlined /> Зарплата: {selectedCandidate.salary_min?.toLocaleString() || 0} - {selectedCandidate.salary_max?.toLocaleString() || 0} ₽</Text>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Навыки</Title>
                <Space wrap>
                  {(() => {
                    const skillsArray = Array.isArray(selectedCandidate.skills) 
                      ? selectedCandidate.skills 
                      : selectedCandidate.skills?.split(',').map(s => s.trim()) || [];
                    
                    return skillsArray.map(skill => (
                      <Tag key={skill}>
                        {skill}
                      </Tag>
                    ));
                  })()}
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Резюме</Title>
                <Text>{selectedCandidate.summary || 'Не указано'}</Text>
              </Col>

              <Col span={24}>
                <Title level={5}>Ссылки</Title>
                <Space direction="vertical">
                  {selectedCandidate.linkedin_url && (
                    <Button 
                      icon={<LinkedinOutlined />} 
                      onClick={() => window.open(selectedCandidate.linkedin_url, '_blank')}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {selectedCandidate.github_url && (
                    <Button 
                      icon={<GithubOutlined />} 
                      onClick={() => window.open(selectedCandidate.github_url, '_blank')}
                    >
                      GitHub
                    </Button>
                  )}
                  {selectedCandidate.profile_url && (
                    <Button 
                      icon={<LinkOutlined />} 
                      onClick={() => window.open(selectedCandidate.profile_url, '_blank')}
                    >
                      Профиль на {getPlatformName(selectedCandidate.platform)}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExternalCandidatesList;
