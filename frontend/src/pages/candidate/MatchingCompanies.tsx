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
  Empty,
  Statistic
} from 'antd';
import {
  BuildOutlined,
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  SendOutlined,
  TrophyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import authAPI from '../../services/api.ts';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Company {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  company_profile?: {
    company_name?: string;
    industry?: string;
    company_size?: string;
    location?: string;
    description?: string;
    technologies?: string;
    benefits?: string;
    remote_work?: boolean;
    website?: string;
    founded_year?: number;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

const MatchingCompanies: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 500000]);
  const [remoteWorkFilter, setRemoteWorkFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>('matchScore');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
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

      if (selectedIndustry !== 'all') {
        params.industry = selectedIndustry;
      }

      if (selectedTechnologies.length > 0) {
        params.technologies = selectedTechnologies.join(',');
      }

      if (sizeFilter !== 'all') {
        params.size = sizeFilter;
      }

      if (remoteWorkFilter !== null) {
        params.remote_work = remoteWorkFilter;
      }

      const response = await authAPI.getCompanies(params);
      setCompanies(response.data);
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error);
      showError({
        title: 'Ошибка загрузки',
        message: 'Не удалось загрузить список компаний'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };


  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setModalVisible(true);
  };

  const handleApplyToCompany = async (companyId: number) => {
    try {
      await authAPI.applyToCompany(companyId);
      showSuccess({
        title: 'Заявка отправлена',
        message: 'Ваша заявка отправлена в компанию. Ожидайте ответа!'
      });
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
      showError({
        title: 'Ошибка отправки',
        message: 'Не удалось отправить заявку'
      });
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#faad14';
    if (score >= 70) return '#fa8c16';
    return '#ff4d4f';
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case '1-10': return 'blue';
      case '11-50': return 'green';
      case '51-200': return 'orange';
      case '201-500': return 'purple';
      case '500+': return 'red';
      default: return 'default';
    }
  };

  const filteredCompanies = companies.filter(company => {
    const companyName = company.company_profile?.company_name || company.first_name; // Используем company_name из профиля или first_name как fallback
    const companyTechnologies = company.company_profile?.technologies ? 
      (typeof company.company_profile.technologies === 'string' 
        ? company.company_profile.technologies.split(',').map(t => t.trim())
        : company.company_profile.technologies) : [];
    
    const matchesSearch = companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.company_profile?.description && company.company_profile.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         companyTechnologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesIndustry = selectedIndustry === 'all' || company.company_profile?.industry === selectedIndustry;
    
    const matchesTechnologies = selectedTechnologies.length === 0 || 
                               selectedTechnologies.every(tech => companyTechnologies.includes(tech));
    
    const matchesSize = sizeFilter === 'all' || company.company_profile?.company_size === sizeFilter;
    
    const matchesRemote = remoteWorkFilter === null || company.company_profile?.remote_work === remoteWorkFilter;

    return matchesSearch && matchesIndustry && matchesTechnologies && matchesSize && matchesRemote;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.first_name.localeCompare(b.first_name);
      case 'size':
        const sizeA = a.company_profile?.company_size || '';
        const sizeB = b.company_profile?.company_size || '';
        return sizeA.localeCompare(sizeB);
      case 'founded':
        const foundedA = a.company_profile?.founded_year || 0;
        const foundedB = b.company_profile?.founded_year || 0;
        return foundedB - foundedA;
      default:
        return 0;
    }
  });

  const allIndustries = Array.from(new Set(companies.map(c => c.company_profile?.industry).filter(Boolean)));
  const allTechnologies = Array.from(new Set(companies.flatMap(c => {
    if (!c.company_profile?.technologies) return [];
    if (typeof c.company_profile.technologies === 'string') {
      return c.company_profile.technologies.split(',').map(t => t.trim());
    }
    return c.company_profile.technologies;
  })));

  return (
    <div className="matching-companies-container">
      <div className="matching-companies-header">
        <div className="matching-companies-hero">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Button 
              icon={<BuildOutlined />} 
              onClick={() => navigate('/candidate/dashboard')}
              className="matching-companies-back-button"
            >
              Назад
            </Button>
            <Title level={2} className="matching-companies-title" style={{ margin: 0 }}>
              Подходящие компании
            </Title>
          </div>
          <Paragraph className="matching-companies-subtitle">
            Найдите идеальную компанию для развития вашей карьеры
          </Paragraph>
        </div>
      </div>

      <div className="matching-companies-content">
        <Row gutter={[24, 24]}>
          {/* Фильтры */}
          <Col xs={24} lg={6}>
            <Card className="matching-companies-filters-card">
              <Title level={4} className="matching-companies-filters-title">Фильтры</Title>
              
              <div className="matching-companies-filter-section">
                <Text strong>Поиск</Text>
                <Search
                  placeholder="Название или описание"
                  onSearch={handleSearch}
                  className="matching-companies-search"
                />
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Отрасль</Text>
                <Select
                  value={selectedIndustry}
                  onChange={setSelectedIndustry}
                  className="matching-companies-industry-select"
                  style={{ width: '100%' }}
                >
                  <Option value="all">Все отрасли</Option>
                  {allIndustries.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Технологии</Text>
                <Select
                  mode="multiple"
                  placeholder="Выберите технологии"
                  value={selectedTechnologies}
                  onChange={setSelectedTechnologies}
                  className="matching-companies-technologies-select"
                  style={{ width: '100%' }}
                >
                  {allTechnologies.map(tech => (
                    <Option key={tech} value={tech}>{tech}</Option>
                  ))}
                </Select>
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Размер компании</Text>
                <Select
                  value={sizeFilter}
                  onChange={setSizeFilter}
                  className="matching-companies-size-select"
                  style={{ width: '100%' }}
                >
                  <Option value="all">Любой размер</Option>
                  <Option value="1-10">1-10 сотрудников</Option>
                  <Option value="11-50">11-50 сотрудников</Option>
                  <Option value="51-200">51-200 сотрудников</Option>
                  <Option value="201-500">201-500 сотрудников</Option>
                  <Option value="500+">500+ сотрудников</Option>
                </Select>
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Зарплата: {salaryRange[0].toLocaleString()} - {salaryRange[1].toLocaleString()} ₽</Text>
                <Slider
                  range
                  min={0}
                  max={500000}
                  step={10000}
                  value={salaryRange}
                  onChange={(value) => setSalaryRange(value as [number, number])}
                  className="matching-companies-slider"
                />
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Удаленная работа</Text>
                <Select
                  value={remoteWorkFilter === null ? 'all' : remoteWorkFilter ? 'yes' : 'no'}
                  onChange={(value) => setRemoteWorkFilter(value === 'all' ? null : value === 'yes')}
                  className="matching-companies-remote-select"
                  style={{ width: '100%' }}
                >
                  <Option value="all">Не важно</Option>
                  <Option value="yes">Да</Option>
                  <Option value="no">Нет</Option>
                </Select>
              </div>

              <Divider />

              <div className="matching-companies-filter-section">
                <Text strong>Сортировка</Text>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="matching-companies-sort-select"
                  style={{ width: '100%' }}
                >
                  <Option value="matchScore">По релевантности</Option>
                  <Option value="rating">По рейтингу</Option>
                  <Option value="salary">По зарплате</Option>
                  <Option value="openPositions">По количеству вакансий</Option>
                </Select>
              </div>
            </Card>
          </Col>

          {/* Список компаний */}
          <Col xs={24} lg={18}>
            <Card className="matching-companies-list-card">
              <div className="matching-companies-list-header">
                <Title level={4} className="matching-companies-list-title">
                  Найдено компаний: {sortedCompanies.length}
                </Title>
              </div>

              {loading ? (
                <div className="matching-companies-loading">
                  <Progress type="circle" />
                </div>
              ) : sortedCompanies.length === 0 ? (
                <Empty
                  description="Компании не найдены"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={sortedCompanies}
                  renderItem={(company) => (
                    <List.Item className="matching-companies-list-item">
                      <Card className="matching-companies-company-card">
                        <Row gutter={[16, 16]} align="middle">
                          <Col xs={24} sm={4} md={3}>
                            <div className="matching-companies-logo-section">
                              <Avatar 
                                size={64} 
                                src={company.avatar_url} 
                                icon={<BuildOutlined />}
                                className="matching-companies-logo"
                              />
                            </div>
                          </Col>

                          <Col xs={24} sm={20} md={21}>
                            <div className="matching-companies-company-info">
                              <div className="matching-companies-company-header">
                                <div className="matching-companies-company-name-section">
                                  <Title level={4} className="matching-companies-company-name">
                                    {company.company_profile?.company_name || company.first_name}
                                  </Title>
                                  <div className="matching-companies-company-tags">
                                    <Tag color={getSizeColor(company.company_profile?.company_size || '')}>
                                      {company.company_profile?.company_size || 'Не указано'} сотрудников
                                    </Tag>
                                    {company.company_profile?.remote_work && (
                                      <Tag color="green">Удаленная работа</Tag>
                                    )}
                                  </div>
                                </div>
                                <div className="matching-companies-company-actions">
                                  <Tooltip title="Добавить в избранное">
                                    <Button
                                      type="text"
                                      icon={<HeartOutlined />}
                                      onClick={() => {
                                        // Логика добавления в избранное
                                      }}
                                      className="matching-companies-favorite-btn"
                                    />
                                  </Tooltip>
                                </div>
                              </div>

                              <div className="matching-companies-company-description">
                                <Paragraph ellipsis={{ rows: 2 }}>
                                  {company.company_profile?.description || 'Описание не указано'}
                                </Paragraph>
                              </div>

                              <div className="matching-companies-company-details">
                                <Space wrap>
                                  <Text className="matching-companies-detail">
                                    <BuildOutlined /> {company.company_profile?.industry || 'Не указано'}
                                  </Text>
                                  <Text className="matching-companies-detail">
                                    <EnvironmentOutlined /> {company.company_profile?.location || 'Не указано'}
                                  </Text>
                                  <Text className="matching-companies-detail">
                                    <CalendarOutlined /> Основана в {company.company_profile?.founded_year || 'Не указано'}
                                  </Text>
                                  <Text className="matching-companies-detail">
                                    <GlobalOutlined /> {company.company_profile?.website || 'Сайт не указан'}
                                  </Text>
                                </Space>
                              </div>

                              <div className="matching-companies-company-technologies">
                                <Text strong>Технологии: </Text>
                                <Space wrap>
                                  {(() => {
                                    if (!company.company_profile?.technologies) return [];
                                    const techs = typeof company.company_profile.technologies === 'string' 
                                      ? company.company_profile.technologies.split(',').map(t => t.trim())
                                      : company.company_profile.technologies;
                                    return techs.slice(0, 5).map(tech => (
                                      <Tag key={tech} className="matching-companies-tech-tag">
                                        {tech}
                                      </Tag>
                                    ));
                                  })()}
                                  {(() => {
                                    if (!company.company_profile?.technologies) return null;
                                    const techs = typeof company.company_profile.technologies === 'string' 
                                      ? company.company_profile.technologies.split(',').map(t => t.trim())
                                      : company.company_profile.technologies;
                                    if (techs.length > 5) {
                                      return (
                                        <Tag className="matching-companies-tech-tag">
                                          +{techs.length - 5} еще
                                        </Tag>
                                      );
                                    }
                                    return null;
                                  })()}
                                </Space>
                              </div>

                              <div className="matching-companies-company-salary">
                                <Text strong>Преимущества: </Text>
                                <Text className="matching-companies-salary">
                                  {company.company_profile?.benefits || 'Не указано'}
                                </Text>
                              </div>

                              <div className="matching-companies-company-stats">
                                <Space>
                                  <Text className="matching-companies-stat">
                                    <CalendarOutlined /> Обновлено {new Date(company.updated_at).toLocaleDateString('ru-RU')}
                                  </Text>
                                  <Text className="matching-companies-stat">
                                    <SendOutlined /> {company.email}
                                  </Text>
                                </Space>
                              </div>

                              <div className="matching-companies-company-actions-bottom">
                                <Space>
                                  <Button 
                                    type="primary" 
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewCompany(company)}
                                    className="matching-companies-view-btn"
                                  >
                                    Посмотреть компанию
                                  </Button>
                                  <Button 
                                    icon={<SendOutlined />}
                                    onClick={() => handleApplyToCompany(company.id)}
                                    className="matching-companies-apply-btn"
                                  >
                                    Подать заявку
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

      {/* Модальное окно с детальной информацией о компании */}
      <Modal
        title={
          <div className="matching-companies-modal-header">
            <Avatar size={48} src={selectedCompany?.avatar_url} icon={<BuildOutlined />} />
            <div>
              <Title level={4} style={{ margin: 0, marginLeft: 12 }}>
                {selectedCompany?.company_profile?.company_name || selectedCompany?.first_name}
              </Title>
              <Text type="secondary">{selectedCompany?.company_profile?.industry || 'Не указано'}</Text>
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
            key="apply" 
            type="primary" 
            icon={<SendOutlined />}
            onClick={() => {
              if (selectedCompany) {
                handleApplyToCompany(selectedCompany.id);
                setModalVisible(false);
              }
            }}
          >
            Подать заявку
          </Button>
        ]}
        width={900}
        className="matching-companies-modal"
      >
        {selectedCompany && (
          <div className="matching-companies-modal-content">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={5}>О компании</Title>
                <Paragraph>{selectedCompany.company_profile?.description || 'Описание не указано'}</Paragraph>
              </Col>

              <Col span={12}>
                <Title level={5}>Основная информация</Title>
                <Space direction="vertical">
                  <Text><BuildOutlined /> {selectedCompany.company_profile?.industry || 'Не указано'}</Text>
                  <Text><TeamOutlined /> {selectedCompany.company_profile?.company_size || 'Не указано'} сотрудников</Text>
                  <Text><EnvironmentOutlined /> {selectedCompany.company_profile?.location || 'Не указано'}</Text>
                  <Text><CalendarOutlined /> Основана в {selectedCompany.company_profile?.founded_year || 'Не указано'}</Text>
                  <Text><GlobalOutlined /> {selectedCompany.company_profile?.website || 'Сайт не указан'}</Text>
                </Space>
              </Col>

              <Col span={12}>
                <Title level={5}>Контактная информация</Title>
                <Space direction="vertical">
                  <Text><MailOutlined /> {selectedCompany.email}</Text>
                  <Text>Удаленная работа: {selectedCompany.company_profile?.remote_work ? 'Да' : 'Нет'}</Text>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Технологии</Title>
                <Space wrap>
                  {(() => {
                    if (!selectedCompany.company_profile?.technologies) return [];
                    const techs = typeof selectedCompany.company_profile.technologies === 'string' 
                      ? selectedCompany.company_profile.technologies.split(',').map(t => t.trim())
                      : selectedCompany.company_profile.technologies;
                    return techs.map(tech => (
                      <Tag key={tech} className="matching-companies-tech-tag">
                        {tech}
                      </Tag>
                    ));
                  })()}
                </Space>
              </Col>

              <Col span={24}>
                <Title level={5}>Преимущества</Title>
                <Text>{selectedCompany.company_profile?.benefits || 'Не указано'}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MatchingCompanies;
