"""
API роуты для аналитики и отчетов с поддержкой ролей и потоков
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_recruiter_or_above
from app.models.user import User, UserRole, RecruitmentStream
from app.models.job import Job, JobApplication, JobApplicationStatus
from app.models.interview_report import InterviewReport
from app.models.job import InterviewInvitation
from app.core.exceptions import AuthorizationError

router = APIRouter()

def get_current_senior_or_lead(current_user: User = Depends(get_current_recruiter_or_above)) -> User:
    """Получение текущего старшего рекрутера или главного рекрутера"""
    if current_user.role not in [UserRole.SENIOR_RECRUITER, UserRole.RECRUIT_LEAD]:
        raise AuthorizationError("Доступ только для старших рекрутеров и главных рекрутеров")
    return current_user

def get_current_recruit_lead(current_user: User = Depends(get_current_recruiter_or_above)) -> User:
    """Получение текущего главного рекрутера"""
    if current_user.role != UserRole.RECRUIT_LEAD:
        raise AuthorizationError("Доступ только для главных рекрутеров")
    return current_user

@router.get("/dashboard")
async def get_analytics_dashboard(
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db),
    period_days: int = Query(30, description="Период в днях")
) -> dict:
    """Получение аналитики для дашборда"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_days)
    
    # Определяем область данных в зависимости от роли
    if current_user.role == UserRole.RECRUITER:
        # Рекрутер видит только свои данные
        stream_filter = and_(User.stream_id == current_user.stream_id)
        recruiter_filter = and_(User.id == current_user.id)
    elif current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер видит данные своего потока
        owned_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).first()
        
        if not owned_stream:
            return {
                "error": "У вас нет потока",
                "metrics": {
                    "total_jobs": 0,
                    "total_applications": 0,
                    "total_interviews": 0,
                    "success_rate": 0,
                    "streams_count": 0,
                    "recruiters_count": 0,
                }
            }
        
        stream_filter = and_(User.stream_id == owned_stream.id)
        recruiter_filter = and_(User.stream_id == owned_stream.id)
    else:  # RECRUIT_LEAD или ADMIN
        # Главный рекрутер видит данные всех потоков
        stream_filter = None
        recruiter_filter = None
    
    # Общие метрики
    total_jobs_query = db.query(Job)
    total_applications_query = db.query(JobApplication)
    total_interviews_query = db.query(InterviewInvitation)
    
    # Применяем фильтры по потокам если нужно
    if stream_filter:
        # Фильтруем по рекрутерам в потоке
        recruiters_in_stream = db.query(User.id).filter(stream_filter).subquery()
        # Здесь нужно добавить логику фильтрации по рекрутерам
        # Пока возвращаем общие данные
    
    total_jobs = total_jobs_query.count()
    total_applications = total_applications_query.count()
    total_interviews = total_interviews_query.count()
    
    # Вычисляем успешность
    successful_applications = total_applications_query.filter(
        JobApplication.status == JobApplicationStatus.ACCEPTED
    ).count()
    
    success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
    
    # Метрики по потокам
    if current_user.role == UserRole.RECRUIT_LEAD:
        streams_count = db.query(RecruitmentStream).count()
        recruiters_count = db.query(User).filter(
            User.role.in_([UserRole.RECRUITER, UserRole.SENIOR_RECRUITER])
        ).count()
    elif current_user.role == UserRole.SENIOR_RECRUITER:
        owned_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).first()
        streams_count = 1 if owned_stream else 0
        recruiters_count = db.query(User).filter(
            User.stream_id == owned_stream.id,
            User.role == UserRole.RECRUITER
        ).count() if owned_stream else 0
    else:
        streams_count = 1 if current_user.stream_id else 0
        recruiters_count = 0
    
    return {
        "metrics": {
            "total_jobs": total_jobs,
            "total_applications": total_applications,
            "total_interviews": total_interviews,
            "success_rate": round(success_rate, 2),
            "streams_count": streams_count,
            "recruiters_count": recruiters_count,
        },
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": period_days,
        },
        "user_role": current_user.role.value,
        "user_stream": {
            "id": current_user.stream_id,
            "name": current_user.stream.name if current_user.stream else None,
        } if current_user.role == UserRole.RECRUITER else None,
    }

@router.get("/streams")
async def get_streams_analytics(
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Получение аналитики по потокам"""
    
    streams_query = db.query(RecruitmentStream).options(
        joinedload(RecruitmentStream.recruiters),
        joinedload(RecruitmentStream.senior_recruiter)
    )
    
    if current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер видит только свой поток
        streams_query = streams_query.filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        )
    
    streams = streams_query.all()
    
    result = []
    for stream in streams:
        # Считаем метрики для каждого потока
        recruiters_in_stream = [r.id for r in stream.recruiters]
        
        # Здесь можно добавить более детальную аналитику по каждому потоку
        stream_metrics = {
            "stream_id": stream.id,
            "stream_name": stream.name,
            "senior_recruiter": {
                "id": stream.senior_recruiter.id if stream.senior_recruiter else None,
                "name": stream.senior_recruiter.full_name if stream.senior_recruiter else None,
            } if stream.senior_recruiter else None,
            "recruiters_count": len(stream.recruiters),
            "recruiters": [
                {
                    "id": r.id,
                    "name": r.full_name,
                    "email": r.email,
                } for r in stream.recruiters
            ],
            "metrics": {
                "total_jobs": 0,  # TODO: Реализовать подсчет
                "total_applications": 0,  # TODO: Реализовать подсчет
                "success_rate": 0,  # TODO: Реализовать подсчет
            }
        }
        
        result.append(stream_metrics)
    
    return result

@router.get("/recruiters")
async def get_recruiters_analytics(
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db),
    stream_id: Optional[int] = Query(None, description="ID потока для фильтрации")
) -> List[dict]:
    """Получение аналитики по рекрутерам"""
    
    recruiters_query = db.query(User).filter(
        User.role.in_([UserRole.RECRUITER, UserRole.SENIOR_RECRUITER])
    ).options(
        joinedload(User.stream)
    )
    
    if current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер видит только рекрутеров своего потока
        owned_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).first()
        
        if owned_stream:
            recruiters_query = recruiters_query.filter(
                or_(
                    User.stream_id == owned_stream.id,
                    User.id == current_user.id
                )
            )
        else:
            recruiters_query = recruiters_query.filter(User.id == current_user.id)
    
    if stream_id:
        recruiters_query = recruiters_query.filter(User.stream_id == stream_id)
    
    recruiters = recruiters_query.all()
    
    result = []
    for recruiter in recruiters:
        recruiter_metrics = {
            "recruiter_id": recruiter.id,
            "name": recruiter.full_name,
            "email": recruiter.email,
            "role": recruiter.role.value,
            "stream": {
                "id": recruiter.stream.id if recruiter.stream else None,
                "name": recruiter.stream.name if recruiter.stream else None,
            } if recruiter.stream else None,
            "is_active": recruiter.is_active,
            "metrics": {
                "total_jobs": 0,  # TODO: Реализовать подсчет
                "total_applications": 0,  # TODO: Реализовать подсчет
                "success_rate": 0,  # TODO: Реализовать подсчет
                "last_activity": recruiter.updated_at.isoformat() if recruiter.updated_at else None,
            }
        }
        
        result.append(recruiter_metrics)
    
    return result

@router.get("/performance")
async def get_performance_analytics(
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db),
    period_days: int = Query(30, description="Период в днях"),
    stream_id: Optional[int] = Query(None, description="ID потока для фильтрации")
) -> dict:
    """Получение аналитики производительности"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=period_days)
    
    # Определяем область данных в зависимости от роли
    if current_user.role == UserRole.RECRUITER:
        # Рекрутер видит только свои данные
        user_filter = [current_user.id]
    elif current_user.role == UserRole.SENIOR_RECRUITER:
        # Старший рекрутер видит данные своего потока
        owned_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).first()
        
        if owned_stream:
            user_filter = [r.id for r in owned_stream.recruiters] + [current_user.id]
        else:
            user_filter = [current_user.id]
    else:  # RECRUIT_LEAD или ADMIN
        # Главный рекрутер видит данные всех потоков
        if stream_id:
            stream_recruiters = db.query(User).filter(
                User.stream_id == stream_id,
                User.role == UserRole.RECRUITER
            ).all()
            user_filter = [r.id for r in stream_recruiters]
        else:
            all_recruiters = db.query(User).filter(
                User.role.in_([UserRole.RECRUITER, UserRole.SENIOR_RECRUITER])
            ).all()
            user_filter = [r.id for r in all_recruiters]
    
    # Здесь можно добавить детальную аналитику производительности
    # Пока возвращаем базовые метрики
    
    performance_data = {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": period_days,
        },
        "scope": {
            "users_count": len(user_filter),
            "stream_id": stream_id,
            "user_role": current_user.role.value,
        },
        "metrics": {
            "total_applications": 0,  # TODO: Реализовать подсчет
            "successful_hires": 0,  # TODO: Реализовать подсчет
            "average_time_to_hire": 0,  # TODO: Реализовать подсчет
            "conversion_rate": 0,  # TODO: Реализовать подсчет
        },
        "trends": {
            "applications_over_time": [],  # TODO: Реализовать тренды
            "hires_over_time": [],  # TODO: Реализовать тренды
        }
    }
    
    return performance_data

@router.get("/export")
async def export_analytics(
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db),
    format: str = Query("json", description="Формат экспорта: json, csv"),
    stream_id: Optional[int] = Query(None, description="ID потока для экспорта")
) -> dict:
    """Экспорт аналитических данных"""
    
    # Здесь можно реализовать экспорт данных в различных форматах
    # Пока возвращаем базовую структуру
    
    export_data = {
        "export_info": {
            "exported_by": current_user.full_name,
            "exported_at": datetime.utcnow().isoformat(),
            "format": format,
            "stream_id": stream_id,
        },
        "data": {
            "streams": [],
            "recruiters": [],
            "metrics": {},
        }
    }
    
    return export_data
