"""
API роуты для компаний
Управление вакансиями, кандидатами
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, CandidateProfile
from app.models.job import Job, JobApplication, JobApplicationStatus

router = APIRouter()

class CandidateApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    job_title: str
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    interview_scheduled_at: Optional[datetime] = None
    interview_completed_at: Optional[datetime] = None
    decision_at: Optional[datetime] = None
    cover_letter: Optional[str] = None
    expected_salary: Optional[int] = None
    availability_date: Optional[datetime] = None
    
    # Информация о кандидате
    candidate_name: str
    candidate_email: str
    candidate_phone: Optional[str] = None
    candidate_avatar: Optional[str] = None
    candidate_experience_years: Optional[int] = None
    candidate_current_position: Optional[str] = None
    candidate_skills: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/dashboard")
async def get_company_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение dashboard компании"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут просматривать dashboard"
        )
    
    # Получаем статистику
    total_jobs = db.query(Job).filter(Job.company_id == current_user.company_profile.id).count()
    active_jobs = db.query(Job).filter(
        Job.company_id == current_user.company_profile.id,
        Job.status == "active"
    ).count()
    
    # Получаем отклики на все вакансии компании
    applications = db.query(JobApplication).join(Job).filter(
        Job.company_id == current_user.company_profile.id
    ).all()
    
    total_applications = len(applications)
    new_applications = len([app for app in applications if app.status == JobApplicationStatus.APPLIED])
    
    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "new_applications": new_applications
    }

@router.get("/candidates", response_model=List[CandidateApplicationResponse])
async def get_company_candidates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение списка кандидатов компании"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут просматривать кандидатов"
        )
    
    # Получаем отклики на все вакансии компании с информацией о кандидатах
    applications = db.query(JobApplication).join(Job).join(CandidateProfile).join(User).filter(
        Job.company_id == current_user.company_profile.id
    ).all()
    
    result = []
    for app in applications:
        candidate = app.candidate.user
        result.append(CandidateApplicationResponse(
            id=app.id,
            candidate_id=app.candidate_id,
            job_id=app.job_id,
            job_title=app.job.title,
            status=app.status.value,
            applied_at=app.applied_at,
            reviewed_at=app.reviewed_at,
            interview_scheduled_at=app.interview_scheduled_at,
            interview_completed_at=app.interview_completed_at,
            decision_at=app.decision_at,
            cover_letter=app.cover_letter,
            expected_salary=app.expected_salary,
            availability_date=app.availability_date,
            candidate_name=f"{candidate.first_name} {candidate.last_name}",
            candidate_email=candidate.email,
            candidate_phone=candidate.phone,
            candidate_avatar=candidate.avatar_url,
            candidate_experience_years=app.candidate.experience_years,
            candidate_current_position=app.candidate.current_position,
            candidate_skills=app.candidate.skills
        ))
    
    return result







