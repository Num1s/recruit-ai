"""
API роуты для вакансий
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, CandidateProfile
from app.models.job import Job, JobStatus, JobType, ExperienceLevel, JobApplication, JobApplicationStatus, InterviewInvitation, InvitationStatus
from app.models.interview_report import InterviewReport, ReportStatus

router = APIRouter()

# Вспомогательная функция для преобразования Job в словарь
def job_to_dict(job: Job) -> dict:
    """Преобразует объект Job в словарь для корректной сериализации"""
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "requirements": job.requirements,
        "responsibilities": job.responsibilities,
        "job_type": job.job_type.value if job.job_type else None,
        "experience_level": job.experience_level.value if job.experience_level else None,
        "location": job.location,
        "is_remote": job.is_remote,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency,
        "required_skills": job.required_skills,
        "nice_to_have_skills": job.nice_to_have_skills,
        "status": job.status.value if job.status else None,
        "is_ai_interview_enabled": job.is_ai_interview_enabled,
        "max_candidates": job.max_candidates,
        "created_at": job.created_at,
        "company_id": job.company_id,
        "company": None
    }

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
    company: Optional[dict] = None

    class Config:
        from_attributes = True

class JobApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None
    expected_salary: Optional[int] = None
    availability_date: Optional[datetime] = None

class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime] = None
    interview_scheduled_at: Optional[datetime] = None
    interview_completed_at: Optional[datetime] = None
    decision_at: Optional[datetime] = None
    cover_letter: Optional[str] = None
    expected_salary: Optional[int] = None
    availability_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class InterviewInvitationCreate(BaseModel):
    job_id: int
    candidate_id: int
    application_id: Optional[int] = None
    expires_at: datetime
    scheduled_at: Optional[datetime] = None  # Планируемое время интервью
    interview_language: str = "ru"
    custom_questions: Optional[List[str]] = None

class InterviewInvitationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    application_id: Optional[int] = None
    status: str
    invited_at: datetime
    expires_at: datetime
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    interview_language: str
    custom_questions: Optional[List[str]] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    company_id: Optional[int] = None,
    search: Optional[str] = None,
    experience_level: Optional[str] = None,
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка вакансий"""
    query = db.query(Job)
    
    if status:
        # Конвертируем строку в enum
        try:
            status_enum = JobStatus(status.lower())
            query = query.filter(Job.status == status_enum)
        except ValueError:
            # Если статус не найден, игнорируем фильтр
            pass
    
    if company_id:
        query = query.filter(Job.company_id == company_id)
    
    if search:
        query = query.filter(
            Job.title.ilike(f"%{search}%") |
            Job.description.ilike(f"%{search}%")
        )
    
    if experience_level:
        try:
            from app.models.job import ExperienceLevel
            exp_enum = ExperienceLevel(experience_level.lower())
            query = query.filter(Job.experience_level == exp_enum)
        except ValueError:
            pass
    
    if job_type:
        try:
            from app.models.job import JobType
            type_enum = JobType(job_type.lower())
            query = query.filter(Job.job_type == type_enum)
        except ValueError:
            pass
    
    if location:
        if location.lower() == 'remote':
            query = query.filter(Job.is_remote == True)
        else:
            query = query.filter(Job.location.ilike(f"%{location}%"))
    
    jobs = query.offset(skip).limit(limit).all()
    
    # Преобразуем в словари и добавляем информацию о компании
    from app.models.user import CompanyProfile, User
    result = []
    for job in jobs:
        job_dict = job_to_dict(job)
        
        if job.company_id:
            company_profile = db.query(CompanyProfile).filter(CompanyProfile.id == job.company_id).first()
            if company_profile:
                job_dict["company"] = {
                    "name": company_profile.company_name,
                    "industry": company_profile.industry,
                    "logo": company_profile.logo_url
                }
        
        result.append(job_dict)
    
    return result

@router.get("/my", response_model=List[JobResponse])
async def get_my_jobs(
    skip: int = 0,
    limit: int = 50,
    status: Optional[JobStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение вакансий текущей компании"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут просматривать свои вакансии"
        )
    
    query = db.query(Job).filter(Job.company_id == current_user.company_profile.id)
    
    if status:
        query = query.filter(Job.status == status)
    
    jobs = query.offset(skip).limit(limit).all()
    
    # Преобразуем в словари для корректной сериализации
    result = []
    for job in jobs:
        job_dict = job_to_dict(job)
        result.append(job_dict)
    
    return result

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
    
    return job_to_dict(job)

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
    
    return job_to_dict(job)

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
    
    return job_to_dict(job)

@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: int,
    status_data: dict,
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
    
    # Конвертируем строку в enum
    try:
        new_status = JobStatus(status_data.get('status', '').lower())
        job.status = new_status
        db.commit()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый статус вакансии"
        )
    
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
    
    # Сначала удаляем все связанные записи
    # Удаляем приглашения на интервью
    db.query(InterviewInvitation).filter(InterviewInvitation.job_id == job_id).delete()
    
    # Удаляем заявки на вакансию
    db.query(JobApplication).filter(JobApplication.job_id == job_id).delete()
    
    # Удаляем отчеты по интервью
    from app.models.interview_report import InterviewReport
    db.query(InterviewReport).filter(InterviewReport.job_id == job_id).delete()
    
    # Теперь удаляем саму вакансию
    db.delete(job)
    db.commit()
    
    return {"message": "Вакансия удалена"}

@router.post("/{job_id}/apply", response_model=JobApplicationResponse)
async def apply_to_job(
    job_id: int,
    application_data: JobApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Подача отклика на вакансию"""
    # Проверяем, что пользователь - кандидат
    if not current_user.candidate_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только кандидаты могут подавать отклики на вакансии"
        )
    
    # Проверяем, что вакансия существует и активна
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    
    if job.status != JobStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="На эту вакансию нельзя подать отклик"
        )
    
    # Проверяем, не подавал ли уже кандидат отклик на эту вакансию
    existing_application = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == current_user.candidate_profile.id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже подавали отклик на эту вакансию"
        )
    
    # Создаем новый отклик
    application = JobApplication(
        job_id=job_id,
        candidate_id=current_user.candidate_profile.id,
        cover_letter=application_data.cover_letter,
        expected_salary=application_data.expected_salary,
        availability_date=application_data.availability_date,
        status=JobApplicationStatus.APPLIED
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return application

@router.get("/{job_id}/applications", response_model=List[JobApplicationResponse])
async def get_job_applications(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение откликов на вакансию (только для владельца вакансии)"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут просматривать отклики на вакансии"
        )
    
    # Проверяем, что вакансия существует и принадлежит компании
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена"
        )
    
    if job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для просмотра откликов на эту вакансию"
        )
    
    # Получаем отклики с информацией о кандидатах
    applications = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).all()
    
    return applications

@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    new_status: JobApplicationStatus,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление статуса отклика (только для владельца вакансии)"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут изменять статус откликов"
        )
    
    # Находим отклик
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отклик не найден"
        )
    
    # Проверяем, что вакансия принадлежит компании
    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job or job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для изменения статуса этого отклика"
        )
    
    # Обновляем статус и соответствующие временные метки
    application.status = new_status
    if new_status == JobApplicationStatus.REVIEWED:
        application.reviewed_at = datetime.now()
    elif new_status == JobApplicationStatus.INTERVIEW_SCHEDULED:
        application.interview_scheduled_at = datetime.now()
    elif new_status == JobApplicationStatus.INTERVIEW_COMPLETED:
        application.interview_completed_at = datetime.now()
    elif new_status in [JobApplicationStatus.ACCEPTED, JobApplicationStatus.REJECTED]:
        application.decision_at = datetime.now()
    
    db.commit()
    
    return {"message": f"Статус отклика изменен на {new_status.value}"}

@router.get("/candidate/applications", response_model=List[JobApplicationResponse])
async def get_candidate_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение откликов кандидата"""
    # Проверяем, что пользователь - кандидат
    if not current_user.candidate_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только кандидаты могут просматривать свои отклики"
        )
    
    # Получаем отклики кандидата
    applications = db.query(JobApplication).filter(
        JobApplication.candidate_id == current_user.candidate_profile.id
    ).all()
    
    return applications

# Эндпоинты для приглашений на интервью
@router.post("/invitations", response_model=InterviewInvitationResponse)
async def create_interview_invitation(
    invitation_data: InterviewInvitationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Создание приглашения на интервью (только для компаний)"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут создавать приглашения на интервью"
        )
    
    # Проверяем, что вакансия принадлежит компании
    job = db.query(Job).filter(Job.id == invitation_data.job_id).first()
    if not job or job.company_id != current_user.company_profile.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Вакансия не найдена или не принадлежит вашей компании"
        )
    
    # Проверяем, что кандидат существует
    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == invitation_data.candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кандидат не найден"
        )
    
    # Создаем приглашение
    invitation = InterviewInvitation(
        job_id=invitation_data.job_id,
        candidate_id=invitation_data.candidate_id,
        application_id=invitation_data.application_id,
        expires_at=invitation_data.expires_at,
        scheduled_at=invitation_data.scheduled_at,
        interview_language=invitation_data.interview_language,
        custom_questions=invitation_data.custom_questions
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    # Добавляем дополнительную информацию для ответа
    invitation_response = InterviewInvitationResponse(
        id=invitation.id,
        job_id=invitation.job_id,
        candidate_id=invitation.candidate_id,
        application_id=invitation.application_id,
        status=invitation.status.value,
        invited_at=invitation.invited_at,
        expires_at=invitation.expires_at,
        scheduled_at=invitation.scheduled_at,
        started_at=invitation.started_at,
        completed_at=invitation.completed_at,
        reviewed_at=invitation.reviewed_at,
        interview_language=invitation.interview_language,
        custom_questions=invitation.custom_questions,
        job_title=job.title,
        company_name=current_user.company_profile.company_name
    )
    
    return invitation_response

@router.get("/invitations/candidate", response_model=List[InterviewInvitationResponse])
async def get_candidate_invitations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение приглашений кандидата"""
    # Проверяем, что пользователь - кандидат
    if not current_user.candidate_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только кандидаты могут просматривать свои приглашения"
        )
    
    # Получаем приглашения кандидата
    invitations = db.query(InterviewInvitation).filter(
        InterviewInvitation.candidate_id == current_user.candidate_profile.id
    ).all()
    
    # Преобразуем в ответ с дополнительной информацией
    invitations_response = []
    for invitation in invitations:
        job = db.query(Job).filter(Job.id == invitation.job_id).first()
        company_user = db.query(User).join(User.company_profile).filter(
            User.company_profile.has(id=job.company_id)
        ).first()
        
        invitations_response.append(InterviewInvitationResponse(
            id=invitation.id,
            job_id=invitation.job_id,
            candidate_id=invitation.candidate_id,
            application_id=invitation.application_id,
            status=invitation.status.value,
            invited_at=invitation.invited_at,
            expires_at=invitation.expires_at,
            scheduled_at=invitation.scheduled_at,
            started_at=invitation.started_at,
            completed_at=invitation.completed_at,
            reviewed_at=invitation.reviewed_at,
            interview_language=invitation.interview_language,
            custom_questions=invitation.custom_questions,
            job_title=job.title if job else None,
            company_name=company_user.company_profile.company_name if company_user and company_user.company_profile else None
        ))
    
    return invitations_response

class InvitationStatusUpdate(BaseModel):
    new_status: InvitationStatus

class InterviewAnalysisRequest(BaseModel):
    invitation_id: int
    interview_duration: Optional[int] = None
    questions_answered: Optional[int] = None

class InterviewReportResponse(BaseModel):
    id: int
    invitation_id: int
    candidate_id: int
    job_id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    experience_score: Optional[float] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    detailed_analysis: Optional[str] = None
    interview_duration: Optional[int] = None
    questions_answered: Optional[int] = None
    ai_notes: Optional[str] = None
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.patch("/invitations/{invitation_id}/status")
async def update_invitation_status(
    invitation_id: int,
    status_data: InvitationStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Обновление статуса приглашения"""
    invitation = db.query(InterviewInvitation).filter(InterviewInvitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашение не найдено"
        )
    
    # Проверяем права доступа
    if current_user.candidate_profile and invitation.candidate_id != current_user.candidate_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этому приглашению"
        )
    
    if current_user.company_profile:
        job = db.query(Job).filter(Job.id == invitation.job_id).first()
        if not job or job.company_id != current_user.company_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет доступа к этому приглашению"
            )
    
    # Обновляем статус
    new_status = status_data.new_status
    invitation.status = new_status
    
    # Обновляем временные метки в зависимости от статуса
    if new_status == InvitationStatus.ACCEPTED:
        invitation.started_at = datetime.now()
    elif new_status == InvitationStatus.COMPLETED:
        invitation.completed_at = datetime.now()
    elif new_status == InvitationStatus.REVIEWED:
        invitation.reviewed_at = datetime.now()
    
    db.commit()
    
    return {"message": f"Статус приглашения изменен на {new_status.value}"}

# Эндпоинты для анализа интервью
@router.post("/interviews/analyze", response_model=InterviewReportResponse)
async def analyze_interview(
    analysis_data: InterviewAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Отправка интервью на анализ ИИ"""
    # Проверяем, что пользователь - кандидат
    if not current_user.candidate_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только кандидаты могут отправлять интервью на анализ"
        )
    
    # Проверяем, что приглашение существует и принадлежит кандидату
    invitation = db.query(InterviewInvitation).filter(
        InterviewInvitation.id == analysis_data.invitation_id,
        InterviewInvitation.candidate_id == current_user.candidate_profile.id
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Приглашение не найдено"
        )
    
    # Проверяем, что отчет еще не создан
    existing_report = db.query(InterviewReport).filter(
        InterviewReport.invitation_id == analysis_data.invitation_id
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Отчет по этому интервью уже существует"
        )
    
    # Создаем отчет
    report = InterviewReport(
        invitation_id=analysis_data.invitation_id,
        candidate_id=current_user.candidate_profile.id,
        job_id=invitation.job_id,
        status=ReportStatus.PROCESSING,
        interview_duration=analysis_data.interview_duration,
        questions_answered=analysis_data.questions_answered
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Обновляем статус приглашения
    invitation.status = InvitationStatus.COMPLETED
    invitation.completed_at = datetime.now()
    db.commit()
    
    # Генерируем заглушку отчета
    await generate_mock_report(report, db)
    
    # Получаем обновленный отчет
    db.refresh(report)
    
    # Добавляем дополнительную информацию для ответа
    job = db.query(Job).filter(Job.id == report.job_id).first()
    company_user = db.query(User).join(User.company_profile).filter(
        User.company_profile.has(id=job.company_id)
    ).first()
    
    report_response = InterviewReportResponse(
        id=report.id,
        invitation_id=report.invitation_id,
        candidate_id=report.candidate_id,
        job_id=report.job_id,
        status=report.status.value,
        created_at=report.created_at,
        completed_at=report.completed_at,
        overall_score=report.overall_score,
        technical_score=report.technical_score,
        communication_score=report.communication_score,
        experience_score=report.experience_score,
        strengths=report.strengths,
        weaknesses=report.weaknesses,
        recommendations=report.recommendations,
        detailed_analysis=report.detailed_analysis,
        interview_duration=report.interview_duration,
        questions_answered=report.questions_answered,
        ai_notes=report.ai_notes,
        candidate_name=f"{current_user.first_name} {current_user.last_name}",
        job_title=job.title if job else None,
        company_name=company_user.company_profile.company_name if company_user and company_user.company_profile else None
    )
    
    return report_response

async def generate_mock_report(report: InterviewReport, db: Session):
    """Генерирует заглушку отчета анализа"""
    import random
    
    # Генерируем случайные оценки
    technical_score = round(random.uniform(70, 95), 1)
    communication_score = round(random.uniform(75, 90), 1)
    experience_score = round(random.uniform(65, 85), 1)
    overall_score = round((technical_score + communication_score + experience_score) / 3, 1)
    
    # Генерируем заглушки для анализа
    strengths = [
        "Отличные технические навыки в области программирования",
        "Хорошие коммуникативные способности",
        "Опыт работы с современными технологиями",
        "Способность к быстрому обучению"
    ]
    
    weaknesses = [
        "Недостаточный опыт работы в команде",
        "Слабое знание некоторых фреймворков",
        "Нуждается в улучшении навыков презентации"
    ]
    
    recommendations = [
        "Рекомендуется для позиции Middle Developer",
        "Подходит для работы в динамичной команде",
        "Требуется дополнительное обучение по DevOps"
    ]
    
    detailed_analysis = f"""
    Кандидат показал хорошие результаты в техническом интервью. 
    Продемонстрировал глубокие знания в области программирования и 
    способность решать сложные задачи. Коммуникативные навыки на 
    высоком уровне, что важно для работы в команде.
    
    Техническая оценка: {technical_score}/100
    Коммуникация: {communication_score}/100  
    Опыт: {experience_score}/100
    
    Общая рекомендация: Кандидат подходит для данной позиции.
    """
    
    # Обновляем отчет
    report.status = ReportStatus.COMPLETED
    report.completed_at = datetime.now()
    report.overall_score = overall_score
    report.technical_score = technical_score
    report.communication_score = communication_score
    report.experience_score = experience_score
    report.strengths = strengths
    report.weaknesses = weaknesses
    report.recommendations = recommendations
    report.detailed_analysis = detailed_analysis
    report.ai_notes = "Анализ выполнен автоматически. Рекомендуется дополнительное собеседование с HR."
    
    db.commit()

@router.get("/reports/company", response_model=List[InterviewReportResponse])
async def get_company_reports(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Получение отчетов по интервью для компании"""
    # Проверяем, что пользователь - компания
    if not current_user.company_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только компании могут просматривать отчеты"
        )
    
    # Получаем отчеты по вакансиям компании
    reports = db.query(InterviewReport).join(Job).filter(
        Job.company_id == current_user.company_profile.id,
        InterviewReport.status == ReportStatus.COMPLETED
    ).all()
    
    # Преобразуем в ответ с дополнительной информацией
    reports_response = []
    for report in reports:
        job = db.query(Job).filter(Job.id == report.job_id).first()
        candidate_user = db.query(User).join(User.candidate_profile).filter(
            User.candidate_profile.has(id=report.candidate_id)
        ).first()
        
        reports_response.append(InterviewReportResponse(
            id=report.id,
            invitation_id=report.invitation_id,
            candidate_id=report.candidate_id,
            job_id=report.job_id,
            status=report.status.value,
            created_at=report.created_at,
            completed_at=report.completed_at,
            overall_score=report.overall_score,
            technical_score=report.technical_score,
            communication_score=report.communication_score,
            experience_score=report.experience_score,
            strengths=report.strengths,
            weaknesses=report.weaknesses,
            recommendations=report.recommendations,
            detailed_analysis=report.detailed_analysis,
            interview_duration=report.interview_duration,
            questions_answered=report.questions_answered,
            ai_notes=report.ai_notes,
            candidate_name=f"{candidate_user.first_name} {candidate_user.last_name}" if candidate_user else None,
            job_title=job.title if job else None,
            company_name=current_user.company_profile.company_name
        ))
    
    return reports_response


