import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { Modal } from '../common/Modal';
import { Alert, AlertDescription } from '../common/Alert';
import { Loader } from '../common/Loader';
// Иконки заменены на эмодзи
import authAPI from '../../services/api';

interface ExternalCandidate {
  id: number;
  external_id: string;
  platform: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  current_position?: string;
  current_company?: string;
  experience_years?: number;
  skills?: string[];
  summary?: string;
  salary_min?: number;
  salary_max?: number;
  profile_url?: string;
  cv_url?: string;
  linkedin_url?: string;
  github_url?: string;
  is_imported: boolean;
  last_synced_at?: string;
  created_at: string;
}

interface Platform {
  value: string;
  name: string;
  description: string;
}

const CandidateSearch: React.FC = () => {
  const [candidates, setCandidates] = useState<ExternalCandidate[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search form
  const [searchForm, setSearchForm] = useState({
    platform: '',
    keywords: [] as string[],
    locations: [] as string[],
    experience_min: '',
    experience_max: '',
    salary_min: '',
    salary_max: '',
    limit: 50
  });

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ExternalCandidate | null>(null);
  const [importNotes, setImportNotes] = useState('');

  useEffect(() => {
    loadPlatforms();
    loadExistingCandidates();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await authAPI.getSupportedPlatforms();
      setPlatforms(response.data.platforms);
    } catch (err: any) {
      setError('Ошибка загрузки платформ');
    }
  };

  const loadExistingCandidates = async () => {
    try {
      const response = await authAPI.getExternalCandidates({ limit: 100 });
      setCandidates(response.data);
    } catch (err: any) {
      console.error('Ошибка загрузки кандидатов:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchForm.platform) {
      setError('Выберите платформу для поиска');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchParams = {
        platform: searchForm.platform,
        keywords: searchForm.keywords.filter(k => k.trim()),
        locations: searchForm.locations.filter(l => l.trim()),
        experience_min: searchForm.experience_min ? parseInt(searchForm.experience_min) : undefined,
        experience_max: searchForm.experience_max ? parseInt(searchForm.experience_max) : undefined,
        salary_min: searchForm.salary_min ? parseInt(searchForm.salary_min) : undefined,
        salary_max: searchForm.salary_max ? parseInt(searchForm.salary_max) : undefined,
        limit: searchForm.limit
      };

      const response = await authAPI.searchCandidates(searchParams);
      setCandidates(response.data);
      setSuccess(`Найдено ${response.data.length} кандидатов`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка поиска кандидатов');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      await authAPI.importCandidate({
        external_candidate_id: selectedCandidate.id,
        create_internal_user: true,
        import_notes: importNotes
      });
      
      setShowImportModal(false);
      setSelectedCandidate(null);
      setImportNotes('');
      setSuccess(`Кандидат ${selectedCandidate.first_name} ${selectedCandidate.last_name} успешно импортирован`);
      loadExistingCandidates();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка импорта кандидата');
    }
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setSearchForm(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getPlatformBadge = (platform: string) => {
    const platformColors: Record<string, string> = {
      linkedin: 'blue',
      hh_ru: 'green',
      superjob: 'purple',
      lalafo: 'orange',
      zarplata: 'red',
      rabota: 'yellow'
    };
    
    return (
      <Badge color={platformColors[platform] as any || 'gray'}>
        {platform.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Поиск кандидатов</h1>
        <p className="text-gray-600">Поиск и импорт кандидатов с внешних платформ</p>
      </div>

      {error && (
        <Alert color="red">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert color="green">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Параметры поиска</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Платформа
              </label>
              <Select
                value={searchForm.platform}
                onValueChange={(value) => setSearchForm(prev => ({ ...prev, platform: value }))}
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
                Лимит результатов
              </label>
              <Input
                type="number"
                value={searchForm.limit}
                onChange={(e) => setSearchForm(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                min="1"
                max="200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ключевые слова (по одному на строку)
            </label>
            <Textarea
              value={searchForm.keywords.join('\n')}
              onChange={(e) => handleArrayInputChange('keywords', e.target.value)}
              placeholder="Python&#10;React&#10;JavaScript&#10;Django"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Локации (по одной на строку)
            </label>
            <Textarea
              value={searchForm.locations.join('\n')}
              onChange={(e) => handleArrayInputChange('locations', e.target.value)}
              placeholder="Москва&#10;Санкт-Петербург&#10;Удаленно"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минимальный опыт (лет)
              </label>
              <Input
                type="number"
                value={searchForm.experience_min}
                onChange={(e) => setSearchForm(prev => ({ ...prev, experience_min: e.target.value }))}
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
                value={searchForm.experience_max}
                onChange={(e) => setSearchForm(prev => ({ ...prev, experience_max: e.target.value }))}
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
                value={searchForm.salary_min}
                onChange={(e) => setSearchForm(prev => ({ ...prev, salary_min: e.target.value }))}
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
                value={searchForm.salary_max}
                onChange={(e) => setSearchForm(prev => ({ ...prev, salary_max: e.target.value }))}
                placeholder="200000"
                min="0"
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader size="sm" className="mr-2" />
                Поиск...
              </>
            ) : (
              <>
                🔍 Найти кандидатов
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Результаты поиска ({candidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 text-gray-400 mx-auto mb-4 text-4xl">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Кандидаты не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {candidate.first_name} {candidate.last_name}
                        </h3>
                        {getPlatformBadge(candidate.platform)}
                        {candidate.is_imported && (
                          <Badge color="green">Импортирован</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          {candidate.current_position && (
                            <div className="flex items-center">
                              💼 {candidate.current_position}
                              {candidate.current_company && ` в ${candidate.current_company}`}
                            </div>
                          )}
                          {candidate.location && (
                            <div className="flex items-center">
                              📍 {candidate.location}
                            </div>
                          )}
                          {candidate.experience_years && (
                            <div className="flex items-center">
                              📅 {candidate.experience_years} лет опыта
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {candidate.salary_min && candidate.salary_max && (
                            <div className="flex items-center">
                              💰 {candidate.salary_min.toLocaleString()} - {candidate.salary_max.toLocaleString()} ₽
                            </div>
                          )}
                          {candidate.email && (
                            <div className="flex items-center">
                              👤 {candidate.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} color="blue" size="sm">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 5 && (
                              <Badge color="gray" size="sm">
                                +{candidate.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {candidate.summary && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {candidate.summary}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Найден: {formatDate(candidate.last_synced_at)}</span>
                        {candidate.profile_url && (
                          <a 
                            href={candidate.profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            🔗 Профиль
                          </a>
                        )}
                        {candidate.linkedin_url && (
                          <a 
                            href={candidate.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            🔗 LinkedIn
                          </a>
                        )}
                        {candidate.github_url && (
                          <a 
                            href={candidate.github_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-gray-600 hover:text-gray-800"
                          >
                            🔗 GitHub
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {!candidate.is_imported && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowImportModal(true);
                          }}
                        >
                          ⬇ Импортировать
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Импорт кандидата"
        size="md"
      >
        {selectedCandidate && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">
                {selectedCandidate.first_name} {selectedCandidate.last_name}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedCandidate.current_position} • {selectedCandidate.platform}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заметки к импорту
              </label>
              <Textarea
                value={importNotes}
                onChange={(e) => setImportNotes(e.target.value)}
                placeholder="Дополнительная информация о кандидате..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImportModal(false)}>
                Отмена
              </Button>
              <Button onClick={handleImportCandidate}>
                ⬇ Импортировать
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CandidateSearch;
