"""
API роуты для интеграций с внешними платформами
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user, get_current_admin, 
    get_current_company_owner, get_current_recruiter_or_above
)
from app.models.user import User
from app.models.integration import IntegrationPlatform
from app.schemas.integration import (
    PlatformIntegration, PlatformIntegrationCreate, PlatformIntegrationUpdate,
    ExternalCandidate, SearchCandidatesRequest, ImportCandidateRequest,
    IntegrationLog, IntegrationStats, SyncStatus
)
from app.services.integration_service import IntegrationService
from app.core.exceptions import ValidationError, NotFoundError

router = APIRouter()

# ========== УПРАВЛЕНИЕ ИНТЕГРАЦИЯМИ ==========

@router.post("/", response_model=PlatformIntegration)
async def create_integration(
    integration_data: PlatformIntegrationCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Создание новой интеграции с внешней платформой"""
    
    service = IntegrationService(db)
    return await service.create_integration(integration_data, current_user.id)

@router.get("/", response_model=List[PlatformIntegration])
async def get_integrations(
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение списка всех интеграций"""
    
    service = IntegrationService(db)
    return await service.get_integrations()

@router.get("/{integration_id}", response_model=PlatformIntegration)
async def get_integration(
    integration_id: int,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение интеграции по ID"""
    
    service = IntegrationService(db)
    return await service.get_integration(integration_id)

@router.put("/{integration_id}", response_model=PlatformIntegration)
async def update_integration(
    integration_id: int,
    update_data: PlatformIntegrationUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление интеграции"""
    
    service = IntegrationService(db)
    return await service.update_integration(integration_id, update_data.dict(exclude_unset=True))

@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Удаление интеграции"""
    
    service = IntegrationService(db)
    await service.delete_integration(integration_id)
    return {"message": "Интеграция успешно удалена"}

# ========== ПОИСК КАНДИДАТОВ ==========

@router.post("/search-candidates", response_model=List[ExternalCandidate])
async def search_candidates(
    search_request: SearchCandidatesRequest,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Поиск кандидатов на внешних платформах"""
    
    service = IntegrationService(db)
    return await service.search_candidates(search_request)

@router.get("/candidates/", response_model=List[ExternalCandidate])
async def get_external_candidates(
    platform: Optional[IntegrationPlatform] = None,
    is_imported: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение списка внешних кандидатов"""
    
    service = IntegrationService(db)
    return await service.get_external_candidates(platform, is_imported, limit, offset)

@router.get("/candidates/{candidate_id}", response_model=ExternalCandidate)
async def get_external_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение внешнего кандидата по ID"""
    
    from app.models.integration import ExternalCandidate
    
    candidate = db.query(ExternalCandidate).filter(
        ExternalCandidate.id == candidate_id
    ).first()
    
    if not candidate:
        raise NotFoundError("Кандидат не найден")
    
    return candidate

# ========== ИМПОРТ КАНДИДАТОВ ==========

@router.post("/import-candidate")
async def import_candidate(
    import_request: ImportCandidateRequest,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Импорт внешнего кандидата в основную систему"""
    
    service = IntegrationService(db)
    internal_user = await service.import_candidate(import_request, current_user.id)
    
    return {
        "message": "Кандидат успешно импортирован",
        "internal_user_id": internal_user.id,
        "email": internal_user.email,
        "full_name": internal_user.full_name
    }

# ========== СИНХРОНИЗАЦИЯ ==========

@router.post("/{integration_id}/sync")
async def sync_integration(
    integration_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Запуск синхронизации интеграции"""
    
    service = IntegrationService(db)
    
    # Запускаем синхронизацию в фоне
    background_tasks.add_task(service.sync_integration, integration_id)
    
    return {"message": "Синхронизация запущена в фоновом режиме"}

@router.get("/{integration_id}/sync-status", response_model=SyncStatus)
async def get_sync_status(
    integration_id: int,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение статуса синхронизации интеграции"""
    
    from app.models.integration import PlatformIntegration, ExternalCandidate
    
    integration = db.query(PlatformIntegration).filter(
        PlatformIntegration.id == integration_id
    ).first()
    
    if not integration:
        raise NotFoundError("Интеграция не найдена")
    
    # Подсчитываем кандидатов
    candidates_count = db.query(ExternalCandidate).filter(
        ExternalCandidate.integration_id == integration_id
    ).count()
    
    imported_count = db.query(ExternalCandidate).filter(
        ExternalCandidate.integration_id == integration_id,
        ExternalCandidate.is_imported == True
    ).count()
    
    return SyncStatus(
        integration_id=integration.id,
        platform=integration.platform,
        status=integration.status.value,
        last_sync_at=integration.last_sync_at,
        next_sync_at=integration.next_sync_at,
        candidates_found=candidates_count,
        candidates_imported=imported_count,
        error_message=integration.last_error
    )

# ========== ЛОГИ И СТАТИСТИКА ==========

@router.get("/{integration_id}/logs", response_model=List[IntegrationLog])
async def get_integration_logs(
    integration_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение логов интеграции"""
    
    service = IntegrationService(db)
    return await service.get_integration_logs(integration_id, limit)

@router.get("/stats/overview", response_model=IntegrationStats)
async def get_integration_stats(
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Получение общей статистики интеграций"""
    
    from app.models.integration import PlatformIntegration, ExternalCandidate
    
    # Общая статистика
    total_integrations = db.query(PlatformIntegration).count()
    active_integrations = db.query(PlatformIntegration).filter(
        PlatformIntegration.is_active == True
    ).count()
    
    total_candidates_found = db.query(ExternalCandidate).count()
    total_candidates_imported = db.query(ExternalCandidate).filter(
        ExternalCandidate.is_imported == True
    ).count()
    
    # Последняя синхронизация
    last_sync = db.query(PlatformIntegration).filter(
        PlatformIntegration.last_sync_at.isnot(None)
    ).order_by(PlatformIntegration.last_sync_at.desc()).first()
    
    last_sync_at = last_sync.last_sync_at if last_sync else None
    
    # Статистика по платформам
    platform_stats = {}
    for platform in IntegrationPlatform:
        platform_integration = db.query(PlatformIntegration).filter(
            PlatformIntegration.platform == platform
        ).first()
        
        if platform_integration:
            platform_candidates = db.query(ExternalCandidate).filter(
                ExternalCandidate.platform == platform
            ).count()
            
            platform_imported = db.query(ExternalCandidate).filter(
                ExternalCandidate.platform == platform,
                ExternalCandidate.is_imported == True
            ).count()
            
            platform_stats[platform.value] = {
                "total_candidates": platform_candidates,
                "imported_candidates": platform_imported,
                "is_active": platform_integration.is_active,
                "last_sync_at": platform_integration.last_sync_at,
                "error_count": platform_integration.error_count
            }
    
    return IntegrationStats(
        total_integrations=total_integrations,
        active_integrations=active_integrations,
        total_candidates_found=total_candidates_found,
        total_candidates_imported=total_candidates_imported,
        last_sync_at=last_sync_at,
        platform_stats=platform_stats
    )

# ========== НАСТРОЙКИ ПЛАТФОРМ ==========

@router.get("/platforms/supported")
async def get_supported_platforms(
    current_user: User = Depends(get_current_recruiter_or_above)
) -> Any:
    """Получение списка поддерживаемых платформ"""
    
    platforms = []
    for platform in IntegrationPlatform:
        platforms.append({
            "value": platform.value,
            "name": platform.value.replace("_", " ").title(),
            "description": _get_platform_description(platform)
        })
    
    return {"platforms": platforms}

def _get_platform_description(platform: IntegrationPlatform) -> str:
    """Получение описания платформы"""
    descriptions = {
        IntegrationPlatform.LINKEDIN: "Профессиональная социальная сеть для поиска кандидатов",
        IntegrationPlatform.HH_RU: "Крупнейший российский сайт поиска работы",
        IntegrationPlatform.SUPERJOB: "Популярная платформа для поиска работы в России",
        IntegrationPlatform.LALAFO: "Платформа объявлений в Кыргызстане",
        IntegrationPlatform.ZARPLATA: "Сайт поиска работы с акцентом на зарплаты",
        IntegrationPlatform.RABOTA: "Украинская платформа поиска работы"
    }
    return descriptions.get(platform, "Платформа для поиска кандидатов")
