"""
Сервис для работы с интеграциями внешних платформ
"""

import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

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
    
    async def get_integrations(self) -> List[PlatformIntegration]:
        """Получение всех интеграций"""
        return self.db.query(PlatformIntegration).all()
    
    async def get_integration(self, integration_id: int) -> PlatformIntegration:
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
            integration.total_candidates_found += len(saved_candidates)
            integration.last_sync_at = datetime.utcnow()
            self.db.commit()
            
            # Логируем поиск
            await self._log_integration_operation(
                integration.id, "search", "success",
                f"Найдено {len(saved_candidates)} кандидатов",
                {"search_params": search_request.dict(), "candidates_count": len(saved_candidates)}
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
        else:
            raise ValidationError(f"Платформа {search_request.platform.value} пока не поддерживается")
    
    async def _search_linkedin(
        self, 
        access_token: str, 
        search_request: SearchCandidatesRequest
    ) -> List[Dict[str, Any]]:
        """Поиск кандидатов в LinkedIn"""
        # TODO: Реализовать поиск через LinkedIn API
        # Пока возвращаем моковые данные
        return [
            {
                "external_id": "linkedin_123",
                "first_name": "Иван",
                "last_name": "Петров",
                "email": "ivan.petrov@example.com",
                "current_position": "Senior Python Developer",
                "current_company": "Tech Company",
                "experience_years": 5,
                "skills": ["Python", "Django", "FastAPI", "PostgreSQL"],
                "location": "Москва",
                "profile_url": "https://linkedin.com/in/ivan-petrov",
                "summary": "Опытный Python разработчик с 5-летним стажем"
            }
        ]
    
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
    
    # ========== УПРАВЛЕНИЕ КАНДИДАТАМИ ==========
    
    async def _save_external_candidate(
        self, 
        integration_id: int, 
        candidate_data: Dict[str, Any]
    ) -> ExternalCandidate:
        """Сохранение внешнего кандидата в базу"""
        
        # Проверяем, не существует ли уже такой кандидат
        existing = self.db.query(ExternalCandidate).filter(
            and_(
                ExternalCandidate.external_id == candidate_data["external_id"],
                ExternalCandidate.platform == candidate_data["platform"]
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
            platform=candidate_data["platform"],
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
        limit: int = 50,
        offset: int = 0
    ) -> List[ExternalCandidate]:
        """Получение списка внешних кандидатов"""
        
        query = self.db.query(ExternalCandidate)
        
        if platform:
            query = query.filter(ExternalCandidate.platform == platform)
        
        if is_imported is not None:
            query = query.filter(ExternalCandidate.is_imported == is_imported)
        
        return query.offset(offset).limit(limit).all()
    
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
