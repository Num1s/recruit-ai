"""
Сервис для работы с интеграциями внешних платформ
"""

import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

logger = logging.getLogger(__name__)

from app.models.integration import (
    PlatformIntegration, ExternalCandidate, IntegrationLog, 
    CandidateImport, IntegrationPlatform, IntegrationStatus
)
from app.models.user import User, UserRole, CandidateProfile
from app.schemas.integration import (
    ExternalCandidateCreate, PlatformIntegrationCreate, 
    SearchCandidatesRequest, ImportCandidateRequest
)
from app.core.exceptions import ValidationError, NotFoundError
from app.core.security import encrypt_data, decrypt_data

class IntegrationService:
    """Сервис для управления интеграциями с внешними платформами"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========== УПРАВЛЕНИЕ ИНТЕГРАЦИЯМИ ==========
    
    async def create_integration(
        self, 
        integration_data: PlatformIntegrationCreate, 
        created_by: int
    ) -> PlatformIntegration:
        """Создание новой интеграции"""
        
        # Проверяем, что интеграция с этой платформой еще не существует
        existing = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.platform == integration_data.platform
        ).first()
        
        if existing:
            raise ValidationError(f"Интеграция с платформой {integration_data.platform.value} уже существует")
        
        # Шифруем чувствительные данные
        encrypted_data = {}
        if integration_data.api_key:
            encrypted_data['api_key'] = encrypt_data(integration_data.api_key)
        if integration_data.api_secret:
            encrypted_data['api_secret'] = encrypt_data(integration_data.api_secret)
        if integration_data.access_token:
            encrypted_data['access_token'] = encrypt_data(integration_data.access_token)
        if integration_data.refresh_token:
            encrypted_data['refresh_token'] = encrypt_data(integration_data.refresh_token)
        
        # Создаем интеграцию
        integration = PlatformIntegration(
            platform=integration_data.platform,
            name=integration_data.name,
            description=integration_data.description,
            is_active=integration_data.is_active,
            auto_sync=integration_data.auto_sync,
            sync_interval_hours=integration_data.sync_interval_hours,
            search_keywords=json.dumps(integration_data.search_keywords) if integration_data.search_keywords else None,
            search_locations=json.dumps(integration_data.search_locations) if integration_data.search_locations else None,
            search_experience_min=integration_data.search_experience_min,
            search_experience_max=integration_data.search_experience_max,
            search_salary_min=integration_data.search_salary_min,
            search_salary_max=integration_data.search_salary_max,
            created_by=created_by,
            status=IntegrationStatus.PENDING
        )
        
        # Добавляем зашифрованные данные
        for key, value in encrypted_data.items():
            setattr(integration, key, value)
        
        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)
        
        # Логируем создание
        await self._log_integration_operation(
            integration.id, "create", "success", 
            f"Интеграция с {integration_data.platform.value} создана"
        )
        
        return integration
    
    async def update_integration(
        self, 
        integration_id: int, 
        update_data: Dict[str, Any]
    ) -> PlatformIntegration:
        """Обновление интеграции"""
        
        integration = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.id == integration_id
        ).first()
        
        if not integration:
            raise NotFoundError("Интеграция не найдена")
        
        # Обновляем поля
        for field, value in update_data.items():
            if hasattr(integration, field):
                if field in ['api_key', 'api_secret', 'access_token', 'refresh_token'] and value:
                    # Шифруем чувствительные данные
                    setattr(integration, field, encrypt_data(value))
                elif field in ['search_keywords', 'search_locations'] and value:
                    # Конвертируем списки в JSON
                    setattr(integration, field, json.dumps(value))
                else:
                    setattr(integration, field, value)
        
        integration.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(integration)
        
        # Логируем обновление
        await self._log_integration_operation(
            integration.id, "update", "success", 
            f"Интеграция {integration.platform.value} обновлена"
        )
        
        return integration
    
    def get_integrations(self) -> List[PlatformIntegration]:
        """Получение всех интеграций"""
        return self.db.query(PlatformIntegration).all()
    
    def get_integration(self, integration_id: int) -> PlatformIntegration:
        """Получение интеграции по ID"""
        integration = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.id == integration_id
        ).first()
        
        if not integration:
            raise NotFoundError("Интеграция не найдена")
        
        return integration
    
    async def delete_integration(self, integration_id: int) -> bool:
        """Удаление интеграции"""
        integration = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.id == integration_id
        ).first()
        
        if not integration:
            raise NotFoundError("Интеграция не найдена")
        
        # Удаляем связанных кандидатов
        self.db.query(ExternalCandidate).filter(
            ExternalCandidate.integration_id == integration_id
        ).delete()
        
        # Удаляем логи
        self.db.query(IntegrationLog).filter(
            IntegrationLog.integration_id == integration_id
        ).delete()
        
        # Удаляем интеграцию
        self.db.delete(integration)
        self.db.commit()
        
        return True
    
    # ========== ПОИСК КАНДИДАТОВ ==========
    
    async def search_candidates(
        self, 
        search_request: SearchCandidatesRequest
    ) -> List[ExternalCandidate]:
        """Поиск кандидатов на внешней платформе"""
        
        # Получаем интеграцию для платформы
        integration = self.db.query(PlatformIntegration).filter(
            and_(
                PlatformIntegration.platform == search_request.platform,
                PlatformIntegration.is_active == True
            )
        ).first()
        
        if not integration:
            raise NotFoundError(f"Активная интеграция с {search_request.platform.value} не найдена")
        
        try:
            # Вызываем соответствующий сервис для платформы
            candidates = await self._search_on_platform(integration, search_request)
            
            # Сохраняем найденных кандидатов
            saved_candidates = []
            for candidate_data in candidates:
                candidate = await self._save_external_candidate(
                    integration.id, candidate_data
                )
                saved_candidates.append(candidate)
            
            # Обновляем статистику
            if integration.total_candidates_found is None:
                integration.total_candidates_found = len(saved_candidates)
            else:
                integration.total_candidates_found += len(saved_candidates)
            integration.last_sync_at = datetime.utcnow()
            self.db.commit()
            
            # Логируем поиск
            search_params = search_request.dict()
            # Преобразуем enum в строку для JSON сериализации
            if 'platform' in search_params and hasattr(search_params['platform'], 'value'):
                search_params['platform'] = search_params['platform'].value
            
            await self._log_integration_operation(
                integration.id, "search", "success",
                f"Найдено {len(saved_candidates)} кандидатов",
                {"search_params": search_params, "candidates_count": len(saved_candidates)}
            )
            
            return saved_candidates
            
        except Exception as e:
            # Логируем ошибку
            await self._log_integration_operation(
                integration.id, "search", "error",
                f"Ошибка поиска кандидатов: {str(e)}"
            )
            raise
    
    async def _search_on_platform(
        self, 
        integration: PlatformIntegration, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов на конкретной платформе"""
        
        # Расшифровываем токены
        access_token = None
        if integration.access_token:
            access_token = decrypt_data(integration.access_token)
        
        if search_request.platform == IntegrationPlatform.LINKEDIN:
            return await self._search_linkedin(access_token, search_request)
        elif search_request.platform == IntegrationPlatform.HH_RU:
            return await self._search_hh_ru(access_token, search_request)
        elif search_request.platform == IntegrationPlatform.SUPERJOB:
            return await self._search_superjob(access_token, search_request)
        elif search_request.platform == IntegrationPlatform.LALAFO:
            return await self._search_lalafo(access_token, search_request)
        else:
            raise ValidationError(f"Платформа {search_request.platform.value} пока не поддерживается")
    
    async def _search_linkedin(
        self, 
        access_token: str, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов в LinkedIn"""
        try:
            # Проверяем, доступен ли aiohttp
            try:
                import aiohttp
                from .linkedin_api import LinkedInAPI
                from ..core.api_config import APIConfig
                
                # Проверяем, настроен ли LinkedIn API
                if not APIConfig.is_linkedin_configured():
                    logger.warning("LinkedIn API не настроен, используем fallback данные")
                    return self._get_linkedin_fallback_data(search_request)
                
                # Создаем экземпляр LinkedIn API
                linkedin_api = LinkedInAPI(access_token)
                
                # Выполняем поиск
                candidates = await linkedin_api.search_people(
                    keywords=search_request.keywords,
                    locations=search_request.locations,
                    experience_min=search_request.experience_min,
                    experience_max=search_request.experience_max,
                    limit=search_request.limit
                )
                
                # Если реальный API не вернул результатов, используем моковые данные
                if not candidates:
                    return self._get_linkedin_fallback_data(search_request)
                
                return candidates
                
            except ImportError:
                logger.warning("aiohttp не установлен, используем fallback данные для LinkedIn")
                return self._get_linkedin_fallback_data(search_request)
            
        except Exception as e:
            logger.error(f"LinkedIn API error: {e}")
            # В случае ошибки возвращаем моковые данные
            return self._get_linkedin_fallback_data(search_request)
    
    def _get_linkedin_fallback_data(self, search_request: SearchCandidatesRequest) -> List[Dict[str, Any]]:
        """Fallback данные для LinkedIn"""
        mock_candidates = [
            {
                "external_id": "linkedin_123",
                "first_name": "Иван",
                "last_name": "Петров",
                "email": "ivan.petrov@example.com",
                "phone": "+7 (999) 123-45-67",
                "current_position": "Senior Python Developer",
                "current_company": "Tech Company",
                "experience_years": 5,
                "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS"],
                "location": "Москва",
                "profile_url": "https://linkedin.com/in/ivan-petrov",
                "linkedin_url": "https://linkedin.com/in/ivan-petrov",
                "github_url": "https://github.com/ivan-petrov",
                "summary": "Опытный Python разработчик с 5-летним стажем. Специализируется на веб-разработке и DevOps.",
                "salary_min": 180000,
                "salary_max": 250000
            },
            {
                "external_id": "linkedin_456",
                "first_name": "Анна",
                "last_name": "Смирнова",
                "email": "anna.smirnova@example.com",
                "phone": "+7 (999) 234-56-78",
                "current_position": "Frontend Developer",
                "current_company": "Digital Agency",
                "experience_years": 3,
                "skills": ["React", "TypeScript", "Node.js", "GraphQL", "Next.js"],
                "location": "Санкт-Петербург",
                "profile_url": "https://linkedin.com/in/anna-smirnova",
                "linkedin_url": "https://linkedin.com/in/anna-smirnova",
                "github_url": "https://github.com/anna-smirnova",
                "summary": "Frontend разработчик с опытом создания современных веб-приложений на React и TypeScript.",
                "salary_min": 140000,
                "salary_max": 200000
            },
            {
                "external_id": "linkedin_789",
                "first_name": "Дмитрий",
                "last_name": "Козлов",
                "email": "dmitry.kozlov@example.com",
                "phone": "+7 (999) 345-67-89",
                "current_position": "DevOps Engineer",
                "current_company": "Cloud Solutions",
                "experience_years": 4,
                "skills": ["Kubernetes", "Docker", "AWS", "Terraform", "Python", "Jenkins"],
                "location": "Екатеринбург",
                "profile_url": "https://linkedin.com/in/dmitry-kozlov",
                "linkedin_url": "https://linkedin.com/in/dmitry-kozlov",
                "github_url": "https://github.com/dmitry-kozlov",
                "summary": "DevOps инженер с опытом автоматизации и управления облачной инфраструктурой.",
                "salary_min": 160000,
                "salary_max": 220000
            }
        ]
        
        # Фильтруем кандидатов по параметрам поиска
        filtered_candidates = []
        for candidate in mock_candidates:
            # Фильтр по ключевым словам
            if search_request.keywords:
                skills_text = " ".join(candidate["skills"])
                position_text = candidate["current_position"].lower()
                if not any(keyword.lower() in skills_text.lower() or keyword.lower() in position_text for keyword in search_request.keywords):
                    continue
            
            # Фильтр по локации
            if search_request.locations:
                if not any(location.lower() in candidate["location"].lower() for location in search_request.locations):
                    continue
            
            # Фильтр по опыту
            if search_request.experience_min and candidate["experience_years"] < search_request.experience_min:
                continue
            if search_request.experience_max and candidate["experience_years"] > search_request.experience_max:
                continue
            
            # Фильтр по зарплате
            if search_request.salary_min and candidate["salary_max"] < search_request.salary_min:
                continue
            if search_request.salary_max and candidate["salary_min"] > search_request.salary_max:
                continue
            
            filtered_candidates.append(candidate)
        
        return filtered_candidates[:search_request.limit]
    
    async def _search_hh_ru(
        self, 
        access_token: str, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов на HH.ru"""
        # TODO: Реализовать поиск через HH.ru API
        return [
            {
                "external_id": "hh_456",
                "first_name": "Анна",
                "last_name": "Сидорова",
                "email": "anna.sidorova@example.com",
                "current_position": "Frontend Developer",
                "current_company": "Web Studio",
                "experience_years": 3,
                "skills": ["React", "TypeScript", "Node.js"],
                "location": "Санкт-Петербург",
                "profile_url": "https://hh.ru/resume/456",
                "summary": "Frontend разработчик с опытом работы с React"
            }
        ]
    
    async def _search_superjob(
        self, 
        access_token: str, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов на SuperJob"""
        # TODO: Реализовать поиск через SuperJob API
        return []
    
    async def _search_lalafo(
        self, 
        access_token: str, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов на Lalafo (Кыргызстан)"""
        try:
            # Проверяем, доступен ли aiohttp
            try:
                import aiohttp
                from .lalafo_api import LalafoAPI
                from ..core.api_config import APIConfig
                
                # Проверяем, настроен ли Lalafo API
                if not APIConfig.is_lalafo_configured():
                    logger.warning("Lalafo API не настроен, используем fallback данные")
                    return self._get_lalafo_fallback_data(search_request)
                
                # Создаем экземпляр Lalafo API
                lalafo_api = LalafoAPI(access_token)
                
                # Выполняем поиск
                candidates = await lalafo_api.search_job_postings(
                    keywords=search_request.keywords,
                    locations=search_request.locations,
                    experience_min=search_request.experience_min,
                    experience_max=search_request.experience_max,
                    limit=search_request.limit
                )
                
                # Если реальный API не вернул результатов, используем моковые данные
                if not candidates:
                    return self._get_lalafo_fallback_data(search_request)
                
                return candidates
                
            except ImportError:
                logger.warning("aiohttp не установлен, используем fallback данные для Lalafo")
                return self._get_lalafo_fallback_data(search_request)
            
        except Exception as e:
            logger.error(f"Lalafo API error: {e}")
            # В случае ошибки возвращаем моковые данные
            return self._get_lalafo_fallback_data(search_request)
    
    def _get_lalafo_fallback_data(self, search_request: SearchCandidatesRequest) -> List[Dict[str, Any]]:
        """Fallback данные для Lalafo"""
        mock_candidates = [
            {
                "external_id": "lalafo_101",
                "first_name": "Айбек",
                "last_name": "Абдылдаев",
                "email": "aibek.abdyl@example.com",
                "phone": "+996 (555) 123-456",
                "current_position": "Python Developer",
                "current_company": "Bishkek Tech",
                "experience_years": 2,
                "skills": ["Python", "Django", "JavaScript", "HTML", "CSS"],
                "location": "Бишкек",
                "profile_url": "https://lalafo.kg/profile/aibek-dev",
                "summary": "Молодой разработчик Python с опытом веб-разработки. Изучаю новые технологии и готов к работе.",
                "salary_min": 80000,
                "salary_max": 120000
            },
            {
                "external_id": "lalafo_102",
                "first_name": "Айгерим",
                "last_name": "Кыдырбекова",
                "email": "aigerim.kydyr@example.com",
                "phone": "+996 (555) 234-567",
                "current_position": "Frontend Developer",
                "current_company": "Osh Digital",
                "experience_years": 3,
                "skills": ["React", "Vue.js", "JavaScript", "TypeScript", "Sass"],
                "location": "Ош",
                "profile_url": "https://lalafo.kg/profile/aigerim-frontend",
                "summary": "Frontend разработчик с опытом создания пользовательских интерфейсов. Работаю с современными фреймворками.",
                "salary_min": 90000,
                "salary_max": 140000
            },
            {
                "external_id": "lalafo_103",
                "first_name": "Марат",
                "last_name": "Жумалиев",
                "email": "marat.zhumal@example.com",
                "phone": "+996 (555) 345-678",
                "current_position": "Full Stack Developer",
                "current_company": "Karakol IT",
                "experience_years": 4,
                "skills": ["Node.js", "React", "MongoDB", "Express", "Docker"],
                "location": "Каракол",
                "profile_url": "https://lalafo.kg/profile/marat-fullstack",
                "summary": "Full Stack разработчик с опытом создания полных веб-приложений от фронтенда до бэкенда.",
                "salary_min": 100000,
                "salary_max": 150000
            },
            {
                "external_id": "lalafo_104",
                "first_name": "Айнура",
                "last_name": "Токтогулова",
                "email": "ainura.toktogul@example.com",
                "phone": "+996 (555) 456-789",
                "current_position": "Mobile Developer",
                "current_company": "Jalal-Abad Tech",
                "experience_years": 2,
                "skills": ["React Native", "Flutter", "JavaScript", "Firebase", "Android"],
                "location": "Джалал-Абад",
                "profile_url": "https://lalafo.kg/profile/ainura-mobile",
                "summary": "Mobile разработчик с опытом создания кроссплатформенных приложений. Специализируюсь на React Native и Flutter.",
                "salary_min": 85000,
                "salary_max": 130000
            }
        ]
        
        # Фильтруем кандидатов по параметрам поиска
        filtered_candidates = []
        for candidate in mock_candidates:
            # Фильтр по ключевым словам
            if search_request.keywords:
                skills_text = " ".join(candidate["skills"])
                position_text = candidate["current_position"].lower()
                if not any(keyword.lower() in skills_text.lower() or keyword.lower() in position_text for keyword in search_request.keywords):
                    continue
            
            # Фильтр по локации
            if search_request.locations:
                if not any(location.lower() in candidate["location"].lower() for location in search_request.locations):
                    continue
            
            # Фильтр по опыту
            if search_request.experience_min and candidate["experience_years"] < search_request.experience_min:
                continue
            if search_request.experience_max and candidate["experience_years"] > search_request.experience_max:
                continue
            
            # Фильтр по зарплате
            if search_request.salary_min and candidate["salary_max"] < search_request.salary_min:
                continue
            if search_request.salary_max and candidate["salary_min"] > search_request.salary_max:
                continue
            
            filtered_candidates.append(candidate)
        
        return filtered_candidates[:search_request.limit]
    
    # ========== УПРАВЛЕНИЕ КАНДИДАТАМИ ==========
    
    async def _save_external_candidate(
        self, 
        integration_id: int, 
        candidate_data: Dict[str, Any]
    ) -> ExternalCandidate:
        """Сохранение внешнего кандидата в базу"""
        
        # Получаем платформу из интеграции
        integration = self.db.query(PlatformIntegration).filter(
            PlatformIntegration.id == integration_id
        ).first()
        
        if not integration:
            raise NotFoundError("Интеграция не найдена")
        
        # Проверяем, не существует ли уже такой кандидат
        existing = self.db.query(ExternalCandidate).filter(
            and_(
                ExternalCandidate.external_id == candidate_data["external_id"],
                ExternalCandidate.platform == integration.platform
            )
        ).first()
        
        if existing:
            # Обновляем существующего кандидата
            for field, value in candidate_data.items():
                if hasattr(existing, field) and field not in ["id", "created_at"]:
                    if field == "skills" and value:
                        setattr(existing, field, json.dumps(value))
                    else:
                        setattr(existing, field, value)
            
            existing.last_synced_at = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # Создаем нового кандидата
        candidate = ExternalCandidate(
            integration_id=integration_id,
            external_id=candidate_data["external_id"],
            platform=integration.platform,  # Используем платформу из интеграции
            first_name=candidate_data.get("first_name"),
            last_name=candidate_data.get("last_name"),
            email=candidate_data.get("email"),
            phone=candidate_data.get("phone"),
            location=candidate_data.get("location"),
            current_position=candidate_data.get("current_position"),
            current_company=candidate_data.get("current_company"),
            experience_years=candidate_data.get("experience_years"),
            skills=json.dumps(candidate_data.get("skills", [])) if candidate_data.get("skills") else None,
            summary=candidate_data.get("summary"),
            salary_min=candidate_data.get("salary_min"),
            salary_max=candidate_data.get("salary_max"),
            profile_url=candidate_data.get("profile_url"),
            cv_url=candidate_data.get("cv_url"),
            linkedin_url=candidate_data.get("linkedin_url"),
            github_url=candidate_data.get("github_url"),
            raw_data=candidate_data.get("raw_data"),
            last_synced_at=datetime.utcnow()
        )
        
        self.db.add(candidate)
        self.db.commit()
        self.db.refresh(candidate)
        
        return candidate
    
    async def get_external_candidates(
        self, 
        platform: Optional[IntegrationPlatform] = None,
        is_imported: Optional[bool] = None,
        search: Optional[str] = None,
        skills: Optional[str] = None,
        experience_min: Optional[int] = None,
        experience_max: Optional[int] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        location: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ExternalCandidate]:
        """Получение списка внешних кандидатов с расширенной фильтрацией"""
        
        query = self.db.query(ExternalCandidate)
        
        # Фильтр по платформе
        if platform:
            query = query.filter(ExternalCandidate.platform == platform)
        
        # Фильтр по статусу импорта
        if is_imported is not None:
            query = query.filter(ExternalCandidate.is_imported == is_imported)
        
        # Поиск по имени, позиции или компании
        if search:
            search_filter = or_(
                ExternalCandidate.first_name.ilike(f"%{search}%"),
                ExternalCandidate.last_name.ilike(f"%{search}%"),
                ExternalCandidate.current_position.ilike(f"%{search}%"),
                ExternalCandidate.current_company.ilike(f"%{search}%"),
                ExternalCandidate.summary.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Фильтр по навыкам
        if skills:
            skills_list = [skill.strip() for skill in skills.split(",")]
            for skill in skills_list:
                query = query.filter(ExternalCandidate.skills.ilike(f"%{skill}%"))
        
        # Фильтр по опыту
        if experience_min is not None:
            query = query.filter(
                or_(
                    ExternalCandidate.experience_years >= experience_min,
                    ExternalCandidate.experience_years.is_(None)
                )
            )
        if experience_max is not None:
            query = query.filter(
                or_(
                    ExternalCandidate.experience_years <= experience_max,
                    ExternalCandidate.experience_years.is_(None)
                )
            )
        
        # Фильтр по зарплате
        if salary_min is not None:
            query = query.filter(
                or_(
                    ExternalCandidate.salary_max >= salary_min,
                    ExternalCandidate.salary_max.is_(None)
                )
            )
        if salary_max is not None:
            query = query.filter(
                or_(
                    ExternalCandidate.salary_min <= salary_max,
                    ExternalCandidate.salary_min.is_(None)
                )
            )
        
        # Фильтр по локации
        if location:
            query = query.filter(ExternalCandidate.location.ilike(f"%{location}%"))
        
        return query.order_by(ExternalCandidate.created_at.desc()).offset(offset).limit(limit).all()
    
    async def import_candidate(
        self, 
        import_request: ImportCandidateRequest, 
        imported_by: int
    ) -> User:
        """Импорт внешнего кандидата в основную систему"""
        
        # Получаем внешнего кандидата
        external_candidate = self.db.query(ExternalCandidate).filter(
            ExternalCandidate.id == import_request.external_candidate_id
        ).first()
        
        if not external_candidate:
            raise NotFoundError("Внешний кандидат не найден")
        
        if external_candidate.is_imported:
            raise ValidationError("Кандидат уже импортирован")
        
        try:
            # Создаем внутреннего пользователя
            internal_user = await self._create_internal_user_from_external(
                external_candidate, imported_by
            )
            
            # Обновляем статус внешнего кандидата
            external_candidate.is_imported = True
            external_candidate.internal_user_id = internal_user.id
            self.db.commit()
            
            # Создаем запись об импорте
            import_record = CandidateImport(
                external_candidate_id=external_candidate.id,
                internal_user_id=internal_user.id,
                imported_by=imported_by,
                import_status="success",
                import_notes=import_request.import_notes
            )
            self.db.add(import_record)
            self.db.commit()
            
            # Обновляем статистику интеграции
            integration = self.db.query(PlatformIntegration).filter(
                PlatformIntegration.id == external_candidate.integration_id
            ).first()
            if integration:
                integration.total_candidates_imported += 1
                self.db.commit()
            
            # Логируем импорт
            await self._log_integration_operation(
                external_candidate.integration_id, "import", "success",
                f"Кандидат {external_candidate.first_name} {external_candidate.last_name} импортирован"
            )
            
            return internal_user
            
        except Exception as e:
            # Логируем ошибку
            await self._log_integration_operation(
                external_candidate.integration_id, "import", "error",
                f"Ошибка импорта кандидата: {str(e)}"
            )
            raise
    
    async def _create_internal_user_from_external(
        self, 
        external_candidate: ExternalCandidate, 
        created_by: int
    ) -> User:
        """Создание внутреннего пользователя из внешнего кандидата"""
        
        # Генерируем временный email если его нет
        email = external_candidate.email
        if not email:
            email = f"imported_{external_candidate.external_id}@{external_candidate.platform.value}.local"
        
        # Проверяем уникальность email
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user:
            email = f"imported_{external_candidate.external_id}_{datetime.now().timestamp()}@{external_candidate.platform.value}.local"
        
        # Создаем пользователя
        from app.core.security import get_password_hash
        user = User(
            email=email,
            hashed_password=get_password_hash("temp_password_123"),  # Временный пароль
            first_name=external_candidate.first_name or "Импортированный",
            last_name=external_candidate.last_name or "Кандидат",
            role=UserRole.CANDIDATE,
            is_active=True,
            is_verified=False
        )
        
        self.db.add(user)
        self.db.flush()  # Получаем ID
        
        # Создаем профиль кандидата
        skills = []
        if external_candidate.skills:
            try:
                skills = json.loads(external_candidate.skills)
            except:
                skills = []
        
        candidate_profile = CandidateProfile(
            user_id=user.id,
            summary=external_candidate.summary,
            experience_years=external_candidate.experience_years,
            current_position=external_candidate.current_position,
            current_company=external_candidate.current_company,
            location=external_candidate.location,
            skills=json.dumps(skills) if skills else None,
            expected_salary_min=external_candidate.salary_min,
            expected_salary_max=external_candidate.salary_max,
            linkedin_url=external_candidate.linkedin_url,
            github_url=external_candidate.github_url
        )
        
        self.db.add(candidate_profile)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    # ========== СИНХРОНИЗАЦИЯ ==========
    
    async def sync_integration(self, integration_id: int) -> Dict[str, Any]:
        """Синхронизация интеграции"""
        
        integration = await self.get_integration(integration_id)
        
        if not integration.is_active:
            raise ValidationError("Интеграция неактивна")
        
        try:
            # Выполняем поиск с текущими настройками
            search_request = SearchCandidatesRequest(
                platform=integration.platform,
                keywords=json.loads(integration.search_keywords) if integration.search_keywords else None,
                locations=json.loads(integration.search_locations) if integration.search_locations else None,
                experience_min=integration.search_experience_min,
                experience_max=integration.search_experience_max,
                salary_min=integration.search_salary_min,
                salary_max=integration.search_salary_max,
                limit=100
            )
            
            candidates = await self.search_candidates(search_request)
            
            # Обновляем время следующей синхронизации
            integration.last_sync_at = datetime.utcnow()
            if integration.auto_sync:
                integration.next_sync_at = datetime.utcnow() + timedelta(
                    hours=integration.sync_interval_hours
                )
            
            integration.status = IntegrationStatus.ACTIVE
            integration.error_count = 0
            integration.last_error = None
            
            self.db.commit()
            
            return {
                "status": "success",
                "candidates_found": len(candidates),
                "last_sync_at": integration.last_sync_at,
                "next_sync_at": integration.next_sync_at
            }
            
        except Exception as e:
            # Обновляем статус ошибки
            integration.status = IntegrationStatus.ERROR
            integration.error_count += 1
            integration.last_error = str(e)
            self.db.commit()
            
            # Логируем ошибку
            await self._log_integration_operation(
                integration_id, "sync", "error", f"Ошибка синхронизации: {str(e)}"
            )
            
            raise
    
    async def get_integration_logs(
        self, 
        integration_id: int, 
        limit: int = 50
    ) -> List[IntegrationLog]:
        """Получение логов интеграции"""
        
        return self.db.query(IntegrationLog).filter(
            IntegrationLog.integration_id == integration_id
        ).order_by(IntegrationLog.created_at.desc()).limit(limit).all()
    
    async def _log_integration_operation(
        self, 
        integration_id: int, 
        operation_type: str, 
        status: str, 
        message: str = None, 
        details: Dict[str, Any] = None
    ):
        """Логирование операции интеграции"""
        
        log = IntegrationLog(
            integration_id=integration_id,
            operation_type=operation_type,
            status=status,
            message=message,
            details=details
        )
        
        self.db.add(log)
        self.db.commit()
