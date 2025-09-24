"""
Модели для интеграции с внешними платформами
LinkedIn, HH.ru, SuperJob и другие
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class IntegrationPlatform(enum.Enum):
    """Поддерживаемые платформы интеграции"""
    LINKEDIN = "linkedin"
    HH_RU = "hh_ru"
    SUPERJOB = "superjob"
    LALAFO = "lalafo"
    ZARPLATA = "zarplata"
    RABOTA = "rabota"

class IntegrationStatus(enum.Enum):
    """Статусы интеграции"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"

class ExternalCandidate(Base):
    """Модель для хранения кандидатов с внешних платформ"""
    __tablename__ = "external_candidates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    external_id = Column(String, nullable=False, index=True)  # ID на внешней платформе
    platform = Column(Enum(IntegrationPlatform), nullable=False, index=True)
    
    # Персональные данные
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    # Профессиональная информация
    current_position = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    skills = Column(Text, nullable=True)  # JSON array as text
    summary = Column(Text, nullable=True)
    
    # Зарплатные ожидания
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    
    # Ссылки
    profile_url = Column(String, nullable=True)
    cv_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    
    # Дополнительные данные в JSON формате
    raw_data = Column(JSON, nullable=True)  # Полные данные с внешней платформы
    
    # Статус и метаданные
    is_imported = Column(Boolean, default=False)  # Импортирован ли в основную систему
    internal_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Связь с внутренним пользователем
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    internal_user = relationship("User", foreign_keys=[internal_user_id])
    integration_id = Column(Integer, ForeignKey("platform_integrations.id"), nullable=True)
    integration = relationship("PlatformIntegration", back_populates="candidates")

class PlatformIntegration(Base):
    """Модель для хранения настроек интеграции с платформами"""
    __tablename__ = "platform_integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    platform = Column(Enum(IntegrationPlatform), nullable=False, unique=True)
    name = Column(String, nullable=False)  # "LinkedIn Integration", "HH.ru Integration"
    description = Column(Text, nullable=True)
    
    # Настройки подключения
    api_key = Column(String, nullable=True)  # Зашифрованный API ключ
    api_secret = Column(String, nullable=True)  # Зашифрованный API секрет
    access_token = Column(String, nullable=True)  # Зашифрованный токен доступа
    refresh_token = Column(String, nullable=True)  # Зашифрованный refresh токен
    
    # Настройки синхронизации
    is_active = Column(Boolean, default=False)
    auto_sync = Column(Boolean, default=True)
    sync_interval_hours = Column(Integer, default=24)  # Интервал синхронизации в часах
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    next_sync_at = Column(DateTime(timezone=True), nullable=True)
    
    # Настройки поиска
    search_keywords = Column(Text, nullable=True)  # JSON array as text
    search_locations = Column(Text, nullable=True)  # JSON array as text
    search_experience_min = Column(Integer, nullable=True)
    search_experience_max = Column(Integer, nullable=True)
    search_salary_min = Column(Integer, nullable=True)
    search_salary_max = Column(Integer, nullable=True)
    
    # Статистика
    total_candidates_found = Column(Integer, default=0)
    total_candidates_imported = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    
    # Метаданные
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.PENDING)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    candidates = relationship("ExternalCandidate", back_populates="integration")

class IntegrationLog(Base):
    """Лог операций интеграции"""
    __tablename__ = "integration_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    integration_id = Column(Integer, ForeignKey("platform_integrations.id"), nullable=False)
    operation_type = Column(String, nullable=False)  # "search", "import", "sync", "error"
    status = Column(String, nullable=False)  # "success", "error", "warning"
    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)  # Дополнительные детали операции
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    integration = relationship("PlatformIntegration")

class CandidateImport(Base):
    """История импорта кандидатов"""
    __tablename__ = "candidate_imports"
    
    id = Column(Integer, primary_key=True, index=True)
    
    external_candidate_id = Column(Integer, ForeignKey("external_candidates.id"), nullable=False)
    internal_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    imported_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    import_status = Column(String, nullable=False)  # "success", "partial", "failed"
    import_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    external_candidate = relationship("ExternalCandidate")
    internal_user = relationship("User", foreign_keys=[internal_user_id])
    importer = relationship("User", foreign_keys=[imported_by])
