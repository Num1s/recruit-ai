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
  Tooltip
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
  LinkedinOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ExternalCandidate {
  id: number;
  external_id: string;
  platform: string;
  full_name: string;
  email?: string;
  phone?: string;
  profile_url?: string;
  linkedin_url?: string;
  github_url?: string;
  current_position?: string;
  current_company?: string;
  experience_years?: number;
  location?: string;
  skills?: string;
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
  const [selectedCandidate, setSelectedCandidate] = useState<ExternalCandidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  useEffect(() => {
    loadCandidates();
  }, [integrationId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      
      // Моковые данные для демонстрации
      const mockCandidates: ExternalCandidate[] = [
        {
          id: 1,
          external_id: 'linkedin_12345',
          platform: 'linkedin',
          full_name: 'Алексей Петров',
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
          salary_min: 150000,
          salary_max: 200000,
          is_imported: false,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          external_id: 'hh_67890',
          platform: 'hh_ru',
          full_name: 'Мария Сидорова',
          email: 'maria.sidorova@email.com',
          phone: '+7 (999) 234-56-78',
          profile_url: 'https://hh.ru/resume/67890',
          current_position: 'Backend Developer',
          current_company: 'StartupXYZ',
          experience_years: 3,
          location: 'Санкт-Петербург',
          skills: 'Python, Django, PostgreSQL, Redis, AWS',
          salary_min: 120000,
          salary_max: 180000,
          is_imported: true,
          last_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          external_id: 'superjob_11111',
          platform: 'superjob',
          full_name: 'Дмитрий Козлов',
          email: 'dmitry.kozlov@email.com',
          phone: '+7 (999) 345-67-89',
          profile_url: 'https://superjob.ru/resume/11111',
          current_position: 'Full Stack Developer',
          current_company: 'WebStudio',
          experience_years: 4,
          location: 'Екатеринбург',
          skills: 'Vue.js, Laravel, MySQL, Git, Linux',
          salary_min: 100000,
          salary_max: 150000,
          is_imported: false,
          last_synced_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ];
      
      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Ошибка загрузки кандидатов:', error);
      message.error('Ошибка загрузки кандидатов');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCandidate = async (candidateId: number) => {
    try {
      setImporting(candidateId);
      
      // Моковый импорт кандидата
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, is_imported: true }
          : candidate
      ));
      
      message.success('Кандидат успешно импортирован');
    } catch (error) {
      console.error('Ошибка импорта кандидата:', error);
      message.error('Ошибка импорта кандидата');
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
    const matchesSearch = candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.current_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' || candidate.platform === platformFilter;
    
    const matchesImported = importedFilter === 'all' || 
                           (importedFilter === 'imported' && candidate.is_imported) ||
                           (importedFilter === 'not_imported' && !candidate.is_imported);

    return matchesSearch && matchesPlatform && matchesImported;
  });

  const platforms = Array.from(new Set(candidates.map(c => c.platform)));

  return (
    <div>
      {/* Фильтры */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Поиск по имени или навыкам"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        </Row>
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
                              {candidate.full_name}
                            </Title>
                            <Tag color={candidate.is_imported ? 'green' : 'orange'}>
                              {candidate.is_imported ? 'Импортирован' : 'Не импортирован'}
                            </Tag>
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
                            {candidate.skills?.split(',').slice(0, 5).map(skill => (
                              <Tag key={skill.trim()}>
                                {skill.trim()}
                              </Tag>
                            ))}
                            {candidate.skills && candidate.skills.split(',').length > 5 && (
                              <Tag>
                                +{candidate.skills.split(',').length - 5} еще
                              </Tag>
                            )}
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
                {selectedCandidate?.full_name}
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
          {!selectedCandidate?.is_imported && (
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
          )},
          {selectedCandidate?.profile_url && (
            <Button 
              key="profile" 
              icon={<LinkOutlined />}
              onClick={() => window.open(selectedCandidate.profile_url, '_blank')}
            >
              Открыть профиль
            </Button>
          )}
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
                  {selectedCandidate.skills?.split(',').map(skill => (
                    <Tag key={skill.trim()}>
                      {skill.trim()}
                    </Tag>
                  ))}
                </Space>
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
