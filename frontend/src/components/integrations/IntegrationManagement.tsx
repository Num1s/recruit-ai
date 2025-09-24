import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { Switch } from '../common/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../common/Tabs';
import { Alert, AlertDescription } from '../common/Alert';
import { Loader } from '../common/Loader';
import authAPI from '../../services/api';

interface Integration {
  id: number;
  platform: string;
  name: string;
  description?: string;
  is_active: boolean;
  auto_sync: boolean;
  sync_interval_hours: number;
  status: string;
  total_candidates_found: number;
  total_candidates_imported: number;
  last_sync_at?: string;
  next_sync_at?: string;
  last_error?: string;
  error_count: number;
  created_at: string;
}

interface Platform {
  value: string;
  name: string;
  description: string;
}

interface IntegrationStats {
  total_integrations: number;
  active_integrations: number;
  total_candidates_found: number;
  total_candidates_imported: number;
  last_sync_at?: string;
  platform_stats: Record<string, any>;
}

const IntegrationManagement: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    platform: '',
    name: '',
    description: '',
    api_key: '',
    api_secret: '',
    access_token: '',
    refresh_token: '',
    is_active: false,
    auto_sync: true,
    sync_interval_hours: 24,
    search_keywords: [] as string[],
    search_locations: [] as string[],
    search_experience_min: '',
    search_experience_max: '',
    search_salary_min: '',
    search_salary_max: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, platformsRes, statsRes] = await Promise.all([
        authAPI.getIntegrations(),
        authAPI.getSupportedPlatforms(),
        authAPI.getIntegrationStats()
      ]);
      
      setIntegrations(integrationsRes.data);
      setPlatforms(platformsRes.data.platforms);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async () => {
    try {
      const integrationData = {
        ...formData,
        search_keywords: formData.search_keywords.filter(k => k.trim()),
        search_locations: formData.search_locations.filter(l => l.trim()),
        search_experience_min: formData.search_experience_min ? parseInt(formData.search_experience_min) : null,
        search_experience_max: formData.search_experience_max ? parseInt(formData.search_experience_max) : null,
        search_salary_min: formData.search_salary_min ? parseInt(formData.search_salary_min) : null,
        search_salary_max: formData.search_salary_max ? parseInt(formData.search_salary_max) : null
      };
      
      await authAPI.createIntegration(integrationData);
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка создания интеграции');
    }
  };

  const handleUpdateIntegration = async () => {
    if (!selectedIntegration) return;
    
    try {
      const updateData = {
        ...formData,
        search_keywords: formData.search_keywords.filter(k => k.trim()),
        search_locations: formData.search_locations.filter(l => l.trim()),
        search_experience_min: formData.search_experience_min ? parseInt(formData.search_experience_min) : null,
        search_experience_max: formData.search_experience_max ? parseInt(formData.search_experience_max) : null,
        search_salary_min: formData.search_salary_min ? parseInt(formData.search_salary_min) : null,
        search_salary_max: formData.search_salary_max ? parseInt(formData.search_salary_max) : null
      };
      
      await authAPI.updateIntegration(selectedIntegration.id, updateData);
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обновления интеграции');
    }
  };

  const handleDeleteIntegration = async () => {
    if (!selectedIntegration) return;
    
    try {
      await authAPI.deleteIntegration(selectedIntegration.id);
      setShowDeleteModal(false);
      setSelectedIntegration(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка удаления интеграции');
    }
  };

  const handleSyncIntegration = async (integrationId: number) => {
    try {
      await authAPI.syncIntegration(integrationId);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка синхронизации');
    }
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      name: '',
      description: '',
      api_key: '',
      api_secret: '',
      access_token: '',
      refresh_token: '',
      is_active: false,
      auto_sync: true,
      sync_interval_hours: 24,
      search_keywords: [],
      search_locations: [],
      search_experience_min: '',
      search_experience_max: '',
      search_salary_min: '',
      search_salary_max: ''
    });
  };

  const openEditModal = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormData({
      platform: integration.platform,
      name: integration.name,
      description: integration.description || '',
      api_key: '',
      api_secret: '',
      access_token: '',
      refresh_token: '',
      is_active: integration.is_active,
      auto_sync: integration.auto_sync,
      sync_interval_hours: integration.sync_interval_hours,
      search_keywords: [],
      search_locations: [],
      search_experience_min: '',
      search_experience_max: '',
      search_salary_min: '',
      search_salary_max: ''
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'green', text: 'Активна' },
      inactive: { color: 'gray', text: 'Неактивна' },
      error: { color: 'red', text: 'Ошибка' },
      pending: { color: 'yellow', text: 'Ожидание' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge color={config.color as any}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление интеграциями</h1>
          <p className="text-gray-600">Настройка подключений к внешним платформам поиска кандидатов</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Добавить интеграцию
        </Button>
      </div>

      {error && (
        <Alert color="red">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">⚙</div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Всего интеграций</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_integrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Активных</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_integrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Найдено кандидатов</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_candidates_found}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Download className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Импортировано</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_candidates_imported}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Интеграции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет интеграций</h3>
                <p className="text-gray-600 mb-4">Создайте первую интеграцию для поиска кандидатов на внешних платформах</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить интеграцию
                </Button>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                        {getStatusBadge(integration.status)}
                        {integration.is_active && (
                          <Badge color="blue">Активна</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
                        <span>Найдено: {integration.total_candidates_found}</span>
                        <span>Импортировано: {integration.total_candidates_imported}</span>
                        <span>Последняя синхронизация: {formatDate(integration.last_sync_at)}</span>
                        {integration.error_count > 0 && (
                          <span className="text-red-600">Ошибок: {integration.error_count}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncIntegration(integration.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(integration)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="red"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Integration Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать интеграцию"
        size="lg"
      >
        <IntegrationForm
          formData={formData}
          setFormData={setFormData}
          platforms={platforms}
          onSubmit={handleCreateIntegration}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Integration Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Редактировать интеграцию"
        size="lg"
      >
        <IntegrationForm
          formData={formData}
          setFormData={setFormData}
          platforms={platforms}
          onSubmit={handleUpdateIntegration}
          onCancel={() => setShowEditModal(false)}
          isEdit={true}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить интеграцию"
        size="sm"
      >
        <div className="space-y-4">
          <p>Вы уверены, что хотите удалить интеграцию "{selectedIntegration?.name}"?</p>
          <p className="text-sm text-gray-600">Это действие нельзя отменить.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Отмена
            </Button>
            <Button color="red" onClick={handleDeleteIntegration}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface IntegrationFormProps {
  formData: any;
  setFormData: (data: any) => void;
  platforms: Platform[];
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const IntegrationForm: React.FC<IntegrationFormProps> = ({
  formData,
  setFormData,
  platforms,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [activeTab, setActiveTab] = useState('basic');

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setFormData((prev: any) => ({
      ...prev,
      [field]: items
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Основные</TabsTrigger>
          <TabsTrigger value="auth">Авторизация</TabsTrigger>
          <TabsTrigger value="search">Поиск</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Платформа
            </label>
            <Select
              value={formData.platform}
              onValueChange={(value) => handleInputChange('platform', value)}
              disabled={isEdit}
            >
              <option value="">Выберите платформу</option>
              {platforms.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Название интеграции"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Описание интеграции"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <label className="ml-2 text-sm text-gray-700">Активна</label>
            </div>
            <div className="flex items-center">
              <Switch
                checked={formData.auto_sync}
                onCheckedChange={(checked) => handleInputChange('auto_sync', checked)}
              />
              <label className="ml-2 text-sm text-gray-700">Автосинхронизация</label>
            </div>
          </div>

          {formData.auto_sync && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Интервал синхронизации (часы)
              </label>
              <Input
                type="number"
                value={formData.sync_interval_hours}
                onChange={(e) => handleInputChange('sync_interval_hours', parseInt(e.target.value))}
                min="1"
                max="168"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <Input
              type="password"
              value={formData.api_key}
              onChange={(e) => handleInputChange('api_key', e.target.value)}
              placeholder="API ключ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <Input
              type="password"
              value={formData.api_secret}
              onChange={(e) => handleInputChange('api_secret', e.target.value)}
              placeholder="API секрет"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <Input
              type="password"
              value={formData.access_token}
              onChange={(e) => handleInputChange('access_token', e.target.value)}
              placeholder="Токен доступа"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refresh Token
            </label>
            <Input
              type="password"
              value={formData.refresh_token}
              onChange={(e) => handleInputChange('refresh_token', e.target.value)}
              placeholder="Токен обновления"
            />
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ключевые слова (по одному на строку)
            </label>
            <Textarea
              value={formData.search_keywords.join('\n')}
              onChange={(e) => handleArrayInputChange('search_keywords', e.target.value)}
              placeholder="Python&#10;React&#10;JavaScript"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Локации (по одной на строку)
            </label>
            <Textarea
              value={formData.search_locations.join('\n')}
              onChange={(e) => handleArrayInputChange('search_locations', e.target.value)}
              placeholder="Москва&#10;Санкт-Петербург&#10;Удаленно"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минимальный опыт (лет)
              </label>
              <Input
                type="number"
                value={formData.search_experience_min}
                onChange={(e) => handleInputChange('search_experience_min', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Максимальный опыт (лет)
              </label>
              <Input
                type="number"
                value={formData.search_experience_max}
                onChange={(e) => handleInputChange('search_experience_max', e.target.value)}
                placeholder="10"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минимальная зарплата
              </label>
              <Input
                type="number"
                value={formData.search_salary_min}
                onChange={(e) => handleInputChange('search_salary_min', e.target.value)}
                placeholder="50000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Максимальная зарплата
              </label>
              <Input
                type="number"
                value={formData.search_salary_max}
                onChange={(e) => handleInputChange('search_salary_max', e.target.value)}
                placeholder="200000"
                min="0"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
};

export default IntegrationManagement;
