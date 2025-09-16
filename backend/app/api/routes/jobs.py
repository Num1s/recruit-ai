"""
API роуты для вакансий
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...core.database import get_db
from ...core.deps import get_current_active_user
from ...models.user import User
from ...models.job import Job, JobStatus, JobType, ExperienceLevel

router = APIRouter()

# Pydantic модели для API
class JobCreate(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel
    location: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "KGS"
    required_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    is_ai_interview_enabled: bool = True
    max_candidates: int = 100

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: Optional[str]
    responsibilities: Optional[str]
    job_type: str
    experience_level: str
    location: Optional[str]
    is_remote: bool
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    required_skills: Optional[List[str]]
    nice_to_have_skills: Optional[List[str]]
    status: str
    is_ai_interview_enabled: bool
    max_candidates: int
    created_at: datetime
    company_id: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = 0,
    limit: int = 50,
    status: Optional[JobStatus] = None,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Получение списка вакансий"""
    query = db.query(Job)
    
    if status:
        query = query.filter(Job.status == status)
    if company_id:
        query = query.filter(Job.company_id == company_id)
    
    jobs = query.offset(skip).limit(limit).all()
    return jobs

@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Создание новой вакансии"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут создавать вакансии"
        )
    
    # Создаем новую вакансию
    job = Job(
        company_id=current_user.company_profile.id,
        title=job_data.title,
        description=job_data.description,
        requirements=job_data.requirements,
        responsibilities=job_data.responsibilities,
        job_type=job_data.job_type,
        experience_level=job_data.experience_level,
        location=job_data.location,
        is_remote=job_data.is_remote,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        salary_currency=job_data.salary_currency,
        required_skills=job_data.required_skills,
        nice_to_have_skills=job_data.nice_to_have_skills,
        status=JobStatus.DRAFT,
        is_ai_interview_enabled=job_data.is_ai_interview_enabled,
        max_candidates=job_data.max_candidates
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return job

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Получение конкретной вакансии"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    return job

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление вакансии"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    
    # Проверяем, что пользователь владеет этой вакансией
    if not current_user.company_profile or job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для редактирования этой вакансии"
        )
    
    # Обновляем поля
    for field, value in job_data.dict(exclude_unset=True).items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    
    return job

@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: int,
    new_status: JobStatus,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление статуса вакансии"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    
    # Проверяем, что пользователь владеет этой вакансией
    if not current_user.company_profile or job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для изменения статуса этой вакансии"
        )
    
    job.status = new_status
    db.commit()
    
    return {"message": f"Статус вакансии изменен на {new_status.value}"}

@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Удаление вакансии"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    
    # Проверяем, что пользователь владеет этой вакансией
    if not current_user.company_profile or job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для удаления этой вакансии"
        )
    
    db.delete(job)
    db.commit()
    
    return {"message": "Вакансия удалена"}






