"""
API роуты для управления потоками рекрутинга
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_active_user, get_current_admin, get_current_company_owner, get_current_senior_or_lead, get_current_stream_manager
from app.models.user import User, UserRole, RecruitmentStream
from app.schemas.stream import Stream, StreamCreate, StreamUpdate
from app.schemas.user import UserBasic
from app.core.exceptions import ValidationError, NotFoundError, AuthorizationError

router = APIRouter()

# Локальная схема для ответа с рекрутерами
class StreamWithRecruiters(Stream):
    """Поток с информацией о рекрутерах"""
    recruiters: List[UserBasic] = []
    senior_recruiter: Optional[UserBasic] = None
    recruit_lead: Optional[UserBasic] = None

def get_current_recruit_lead(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущего главного рекрутера"""
    if current_user.role != UserRole.RECRUIT_LEAD:
        raise AuthorizationError("Доступ только для главных рекрутеров")
    return current_user

def get_current_senior_or_lead(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущего старшего рекрутера или главного рекрутера"""
    if current_user.role not in [UserRole.SENIOR_RECRUITER, UserRole.RECRUIT_LEAD]:
        raise AuthorizationError("Доступ только для старших рекрутеров и главных рекрутеров")
    return current_user

def get_current_recruiter_or_above(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущего рекрутера или выше"""
    if current_user.role not in [UserRole.RECRUITER, UserRole.SENIOR_RECRUITER, UserRole.RECRUIT_LEAD]:
        raise AuthorizationError("Доступ только для рекрутеров и выше")
    return current_user

@router.get("/test")
async def test_streams():
    """Тестовый endpoint для проверки работы"""
    return {"message": "Streams API работает!", "status": "ok"}

@router.get("/", response_model=List[StreamWithRecruiters])
async def get_streams(
    current_user: User = Depends(get_current_stream_manager),
    db: Session = Depends(get_db)
) -> List[StreamWithRecruiters]:
    """Получение списка потоков (для управляющих потоками)"""
    
    if current_user.role in [UserRole.RECRUIT_LEAD, UserRole.ADMIN, UserRole.COMPANY]:
        # Recruit Lead, Admin и владельцы компаний видят все потоки
        streams = db.query(RecruitmentStream).options(
            joinedload(RecruitmentStream.recruiters),
            joinedload(RecruitmentStream.senior_recruiter),
            joinedload(RecruitmentStream.recruit_lead)
        ).all()
    elif current_user.role == UserRole.SENIOR_RECRUITER:
        # Senior Recruiter видит только свой поток
        streams = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).options(
            joinedload(RecruitmentStream.recruiters),
            joinedload(RecruitmentStream.senior_recruiter),
            joinedload(RecruitmentStream.recruit_lead)
        ).all()
    else:
        # Для других ролей возвращаем пустой список
        streams = []
    
    return streams

@router.post("/", response_model=Stream)
async def create_stream(
    stream_data: StreamCreate,
    current_user: User = Depends(get_current_company_owner),
    db: Session = Depends(get_db)
) -> Stream:
    """Создание нового потока (для владельцев компаний и администраторов)"""
    
    # Проверяем, что название потока уникально
    existing_stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.name == stream_data.name
    ).first()
    
    if existing_stream:
        raise ValidationError("Поток с таким названием уже существует")
    
    # Валидация senior_recruiter_id
    if stream_data.senior_recruiter_id:
        senior_recruiter = db.query(User).filter(
            User.id == stream_data.senior_recruiter_id,
            User.role == UserRole.SENIOR_RECRUITER
        ).first()
        
        if not senior_recruiter:
            raise ValidationError("Указанный пользователь не является старшим рекрутером")
        
        # Проверяем, что у старшего рекрутера еще нет потока
        existing_stream_for_senior = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == stream_data.senior_recruiter_id
        ).first()
        
        if existing_stream_for_senior:
            raise ValidationError("У этого старшего рекрутера уже есть поток")
    
    # Создаем поток
    stream = RecruitmentStream(
        name=stream_data.name,
        senior_recruiter_id=stream_data.senior_recruiter_id,
        recruit_lead_id=current_user.id
    )
    
    db.add(stream)
    db.commit()
    db.refresh(stream)
    
    return stream

@router.get("/{stream_id}", response_model=StreamWithRecruiters)
async def get_stream(
    stream_id: int,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> StreamWithRecruiters:
    """Получение потока по ID"""
    
    stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.id == stream_id
    ).options(
        joinedload(RecruitmentStream.recruiters),
        joinedload(RecruitmentStream.senior_recruiter),
        joinedload(RecruitmentStream.recruit_lead)
    ).first()
    
    if not stream:
        raise NotFoundError("Поток не найден")
    
    # Проверяем права доступа
    if current_user.role == UserRole.RECRUITER:
        # Рекрутер может видеть только свой поток
        if current_user.stream_id != stream_id:
            raise AuthorizationError("Доступ запрещен")
    elif current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер может видеть только свой поток
        if stream.senior_recruiter_id != current_user.id:
            raise AuthorizationError("Доступ запрещен")
    # Recruit Lead может видеть все потоки
    
    return stream

@router.put("/{stream_id}", response_model=Stream)
async def update_stream(
    stream_id: int,
    stream_data: StreamUpdate,
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> Stream:
    """Обновление потока"""
    
    stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.id == stream_id
    ).first()
    
    if not stream:
        raise NotFoundError("Поток не найден")
    
    # Проверяем права доступа
    if current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер может обновлять только свой поток
        if stream.senior_recruiter_id != current_user.id:
            raise AuthorizationError("Доступ запрещен")
    
    # Валидация названия
    if stream_data.name and stream_data.name != stream.name:
        existing_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.name == stream_data.name,
            RecruitmentStream.id != stream_id
        ).first()
        
        if existing_stream:
            raise ValidationError("Поток с таким названием уже существует")
    
    # Валидация senior_recruiter_id
    if stream_data.senior_recruiter_id:
        senior_recruiter = db.query(User).filter(
            User.id == stream_data.senior_recruiter_id,
            User.role == UserRole.SENIOR_RECRUITER
        ).first()
        
        if not senior_recruiter:
            raise ValidationError("Указанный пользователь не является старшим рекрутером")
        
        # Проверяем, что у старшего рекрутера еще нет другого потока
        existing_stream_for_senior = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == stream_data.senior_recruiter_id,
            RecruitmentStream.id != stream_id
        ).first()
        
        if existing_stream_for_senior:
            raise ValidationError("У этого старшего рекрутера уже есть другой поток")
    
    # Обновляем поля
    for field, value in stream_data.dict(exclude_unset=True).items():
        setattr(stream, field, value)
    
    stream.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(stream)
    
    return stream

@router.delete("/{stream_id}")
async def delete_stream(
    stream_id: int,
    current_user: User = Depends(get_current_recruit_lead),
    db: Session = Depends(get_db)
) -> dict:
    """Удаление потока (только для Recruit Lead)"""
    
    stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.id == stream_id
    ).first()
    
    if not stream:
        raise NotFoundError("Поток не найден")
    
    # Проверяем, что в потоке нет рекрутеров
    recruiters_count = db.query(User).filter(
        User.stream_id == stream_id,
        User.role == UserRole.RECRUITER
    ).count()
    
    if recruiters_count > 0:
        raise ValidationError("Нельзя удалить поток, в котором есть рекрутеры")
    
    db.delete(stream)
    db.commit()
    
    return {"message": "Поток успешно удален"}

@router.post("/{stream_id}/recruiters/{recruiter_id}")
async def add_recruiter_to_stream(
    stream_id: int,
    recruiter_id: int,
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> dict:
    """Добавление рекрутера в поток"""
    
    stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.id == stream_id
    ).first()
    
    if not stream:
        raise NotFoundError("Поток не найден")
    
    # Проверяем права доступа
    if current_user.role == UserRole.SENIOR_RECRUITER:
        if stream.senior_recruiter_id != current_user.id:
            raise AuthorizationError("Доступ запрещен")
    
    recruiter = db.query(User).filter(
        User.id == recruiter_id,
        User.role == UserRole.RECRUITER
    ).first()
    
    if not recruiter:
        raise NotFoundError("Рекрутер не найден")
    
    if recruiter.stream_id is not None:
        raise ValidationError("Рекрутер уже назначен в другой поток")
    
    recruiter.stream_id = stream_id
    db.commit()
    
    return {
        "message": f"Рекрутер {recruiter.full_name} добавлен в поток {stream.name}",
        "stream_id": stream_id,
        "recruiter_id": recruiter_id
    }

@router.delete("/{stream_id}/recruiters/{recruiter_id}")
async def remove_recruiter_from_stream(
    stream_id: int,
    recruiter_id: int,
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> dict:
    """Удаление рекрутера из потока"""
    
    stream = db.query(RecruitmentStream).filter(
        RecruitmentStream.id == stream_id
    ).first()
    
    if not stream:
        raise NotFoundError("Поток не найден")
    
    # Проверяем права доступа
    if current_user.role == UserRole.SENIOR_RECRUITER:
        if stream.senior_recruiter_id != current_user.id:
            raise AuthorizationError("Доступ запрещен")
    
    recruiter = db.query(User).filter(
        User.id == recruiter_id,
        User.role == UserRole.RECRUITER,
        User.stream_id == stream_id
    ).first()
    
    if not recruiter:
        raise NotFoundError("Рекрутер не найден в этом потоке")
    
    recruiter.stream_id = None
    db.commit()
    
    return {
        "message": f"Рекрутер {recruiter.full_name} удален из потока {stream.name}",
        "stream_id": stream_id,
        "recruiter_id": recruiter_id
    }

@router.get("/available/recruiters", response_model=List[UserBasic])
async def get_available_recruiters(
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> List[UserBasic]:
    """Получение списка рекрутеров без потока"""
    
    recruiters = db.query(User).filter(
        User.role == UserRole.RECRUITER,
        User.stream_id.is_(None),
        User.is_active == True
    ).all()
    
    return recruiters
