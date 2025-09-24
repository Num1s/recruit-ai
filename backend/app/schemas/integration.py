"""
Схемы для интеграции с внешними платформами
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.integration import IntegrationPlatform, IntegrationStatus

class ExternalCandidateBase(BaseModel):
    """Базовая схема внешнего кандидата"""
    external_id: str
    platform: IntegrationPlatform
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    summary: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    profile_url: Optional[str] = None
    cv_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class ExternalCandidateCreate(ExternalCandidateBase):
    """Схема для создания внешнего кандидата"""
    raw_data: Optional[Dict[str, Any]] = None

class ExternalCandidateUpdate(BaseModel):
    """Схема для обновления внешнего кандидата"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    summary: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    profile_url: Optional[str] = None
    cv_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    is_imported: Optional[bool] = None
    internal_user_id: Optional[int] = None

class ExternalCandidate(ExternalCandidateBase):
    """Схема внешнего кандидата для ответа"""
    id: int
    is_imported: bool
    internal_user_id: Optional[int] = None
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @validator('skills', pre=True)
    def parse_skills(cls, v):
        """Парсинг навыков из JSON строки"""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v
    
    class Config:
        from_attributes = True

class PlatformIntegrationBase(BaseModel):
    """Базовая схема интеграции с платформой"""
    platform: IntegrationPlatform
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = False
    auto_sync: Optional[bool] = True
    sync_interval_hours: Optional[int] = 24
    search_keywords: Optional[List[str]] = None
    search_locations: Optional[List[str]] = None
    search_experience_min: Optional[int] = None
    search_experience_max: Optional[int] = None
    search_salary_min: Optional[int] = None
    search_salary_max: Optional[int] = None

class PlatformIntegrationCreate(PlatformIntegrationBase):
    """Схема для создания интеграции"""
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class PlatformIntegrationUpdate(BaseModel):
    """Схема для обновления интеграции"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    auto_sync: Optional[bool] = None
    sync_interval_hours: Optional[int] = None
    search_keywords: Optional[List[str]] = None
    search_locations: Optional[List[str]] = None
    search_experience_min: Optional[int] = None
    search_experience_max: Optional[int] = None
    search_salary_min: Optional[int] = None
    search_salary_max: Optional[int] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class PlatformIntegration(PlatformIntegrationBase):
    """Схема интеграции для ответа"""
    id: int
    status: IntegrationStatus
    total_candidates_found: Optional[int] = 0
    total_candidates_imported: Optional[int] = 0
    last_sync_at: Optional[datetime] = None
    next_sync_at: Optional[datetime] = None
    last_error: Optional[str] = None
    error_count: Optional[int] = 0
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class IntegrationLogBase(BaseModel):
    """Базовая схема лога интеграции"""
    integration_id: int
    operation_type: str
    status: str
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class IntegrationLog(IntegrationLogBase):
    """Схема лога для ответа"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CandidateImportBase(BaseModel):
    """Базовая схема импорта кандидата"""
    external_candidate_id: int
    internal_user_id: int
    import_status: str
    import_notes: Optional[str] = None

class CandidateImport(CandidateImportBase):
    """Схема импорта для ответа"""
    id: int
    imported_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class SearchCandidatesRequest(BaseModel):
    """Схема запроса поиска кандидатов"""
    platform: IntegrationPlatform
    keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    limit: int = Field(default=50, ge=1, le=200)

class SearchCandidatesResponse(BaseModel):
    """Схема ответа поиска кандидатов"""
    platform: IntegrationPlatform
    total_found: int
    candidates: List[ExternalCandidate]
    search_params: Dict[str, Any]

class ImportCandidateRequest(BaseModel):
    """Схема запроса импорта кандидата"""
    external_candidate_id: int
    create_internal_user: bool = True
    import_notes: Optional[str] = None

class IntegrationStats(BaseModel):
    """Статистика интеграций"""
    total_integrations: int
    active_integrations: int
    total_candidates_found: int
    total_candidates_imported: int
    last_sync_at: Optional[datetime] = None
    platform_stats: Dict[str, Dict[str, Any]]

class SyncStatus(BaseModel):
    """Статус синхронизации"""
    integration_id: int
    platform: IntegrationPlatform
    status: str
    last_sync_at: Optional[datetime] = None
    next_sync_at: Optional[datetime] = None
    candidates_found: int
    candidates_imported: int
    error_message: Optional[str] = None
