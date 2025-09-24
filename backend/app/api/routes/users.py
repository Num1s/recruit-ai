"""
API роуты для пользователей
"""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Any
import os
import uuid
from datetime import datetime

from app.core.database import get_db
from app.core.deps import (
    get_current_active_user, get_current_candidate, get_current_company, 
    get_current_company_owner, get_current_admin, get_current_recruit_lead, 
    get_current_senior_or_lead, get_current_recruiter_or_above
)
from app.core.config import settings
from app.models.user import User, CandidateProfile, CompanyProfile, UserRole, RecruitmentStream
from app.schemas.user import (
    UserUpdate, CandidateProfileUpdate, CompanyProfileUpdate,
    CandidateWithProfile, CompanyWithProfile, UserCreate, UserBasic
)
from app.schemas.stream import Stream
from typing import List, Optional
from app.core.exceptions import ValidationError, NotFoundError

router = APIRouter()

@router.get("/profile/candidate", response_model=CandidateWithProfile)
async def get_candidate_profile(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Получение профиля кандидата"""
    
    # Загружаем профиль кандидата
    if not current_user.candidate_profile:
        # Создаем профиль если не существует
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(current_user)
    
    return current_user

@router.put("/profile/candidate", response_model=CandidateWithProfile)
async def update_candidate_profile(
    profile_data: CandidateProfileUpdate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление профиля кандидата"""
    
    profile = current_user.candidate_profile
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    
    # Обновляем поля профиля
    for field, value in profile_data.dict(exclude_unset=True).items():
        if field in ["skills", "preferred_locations"] and value is not None:
            # Конвертируем списки в JSON строки
            import json
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/profile/company", response_model=CompanyWithProfile)
async def get_company_profile(
    current_user: User = Depends(get_current_company),
    db: Session = Depends(get_db)
) -> Any:
    """Получение профиля компании"""
    
    if not current_user.company_profile:
        raise NotFoundError("Профиль компании не найден")
    
    return current_user

@router.put("/profile/company", response_model=CompanyWithProfile)
async def update_company_profile(
    profile_data: CompanyProfileUpdate,
    current_user: User = Depends(get_current_company),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление профиля компании"""
    
    profile = current_user.company_profile
    if not profile:
        raise NotFoundError("Профиль компании не найден")
    
    # Обновляем поля профиля
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.put("/profile", response_model=dict)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление основного профиля пользователя"""
    
    # Обновляем поля пользователя
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    
    return {"message": "Профиль успешно обновлен"}

@router.post("/upload/cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Загрузка резюме кандидата"""
    
    # Проверка типа файла
    if not file.filename.lower().endswith(tuple(settings.ALLOWED_FILE_EXTENSIONS)):
        raise ValidationError(
            f"Неподдерживаемый тип файла. Разрешены: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
        )
    
    # Проверка размера файла
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise ValidationError(f"Файл слишком большой. Максимальный размер: {settings.MAX_FILE_SIZE // (1024*1024)} МБ")
    
    # Создание уникального имени файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Создание директории для загрузок
    upload_dir = os.path.join(settings.UPLOAD_DIRECTORY, "cv")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Сохранение файла
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Обновление профиля кандидата
    profile = current_user.candidate_profile
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    
    # Удаление старого файла если существует
    if profile.cv_url and os.path.exists(profile.cv_url):
        try:
            os.remove(profile.cv_url)
        except:
            pass
    
    profile.cv_filename = file.filename
    profile.cv_url = file_path
    profile.cv_uploaded_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Резюме успешно загружено",
        "filename": file.filename,
        "uploaded_at": profile.cv_uploaded_at
    }

@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Загрузка аватара пользователя"""
    
    # Проверка типа файла
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif"]
    if not file.filename.lower().endswith(tuple(allowed_extensions)):
        raise ValidationError(
            f"Неподдерживаемый тип файла. Разрешены: {', '.join(allowed_extensions)}"
        )
    
    # Проверка размера файла (максимум 5 МБ для изображений)
    max_image_size = 5 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_image_size:
        raise ValidationError("Файл слишком большой. Максимальный размер: 5 МБ")
    
    # Создание уникального имени файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Создание директории для загрузок
    upload_dir = os.path.join(settings.UPLOAD_DIRECTORY, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Сохранение файла
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Удаление старого аватара если существует
    if current_user.avatar_url and os.path.exists(current_user.avatar_url):
        try:
            os.remove(current_user.avatar_url)
        except:
            pass
    
    # Обновление пользователя
    current_user.avatar_url = file_path
    db.commit()
    
    return {
        "message": "Аватар успешно загружен",
        "avatar_url": f"/uploads/avatars/{unique_filename}"
    }

@router.get("/candidates", response_model=List[CandidateWithProfile])
async def get_candidates(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    skills: Optional[str] = None,
    experience_min: Optional[int] = None,
    experience_max: Optional[int] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    availability: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Получение списка кандидатов с фильтрацией"""
    
    query = db.query(User).outerjoin(CandidateProfile).filter(User.role == UserRole.CANDIDATE)
    
    # Поиск по имени или email
    if search:
        query = query.filter(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    # Фильтр по навыкам - учитываем None значения
    if skills:
        skills_list = [skill.strip() for skill in skills.split(",")]
        for skill in skills_list:
            # Включаем кандидатов с навыком ИЛИ с пустыми навыками (None)
            query = query.filter(
                (CandidateProfile.skills.ilike(f"%{skill}%")) |
                (CandidateProfile.skills.is_(None))
            )
    
    # Фильтр по опыту - учитываем None значения
    if experience_min is not None:
        # Включаем кандидатов с достаточным опытом ИЛИ с не указанным опытом (None)
        query = query.filter(
            (CandidateProfile.experience_years >= experience_min) |
            (CandidateProfile.experience_years.is_(None))
        )
    if experience_max is not None:
        # Включаем кандидатов с опытом не больше указанного ИЛИ с не указанным опытом (None)
        query = query.filter(
            (CandidateProfile.experience_years <= experience_max) |
            (CandidateProfile.experience_years.is_(None))
        )
    
    # Фильтр по зарплате - учитываем None значения
    if salary_min is not None:
        # Включаем кандидатов с достаточной зарплатой ИЛИ с не указанной зарплатой (None)
        query = query.filter(
            (CandidateProfile.expected_salary_min >= salary_min) |
            (CandidateProfile.expected_salary_min.is_(None))
        )
    if salary_max is not None:
        # Включаем кандидатов с зарплатой не больше указанной ИЛИ с не указанной зарплатой (None)
        query = query.filter(
            (CandidateProfile.expected_salary_max <= salary_max) |
            (CandidateProfile.expected_salary_max.is_(None))
        )
    
    # Фильтр по доступности - учитываем None значения
    if availability:
        # Включаем кандидатов с указанной доступностью ИЛИ с не указанной доступностью (None)
        query = query.filter(
            (CandidateProfile.availability == availability) |
            (CandidateProfile.availability.is_(None))
        )
    
    candidates = query.offset(skip).limit(limit).all()
    return candidates

@router.get("/companies", response_model=List[CompanyWithProfile])
async def get_companies(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    industry: Optional[str] = None,
    size: Optional[str] = None,
    location: Optional[str] = None,
    technologies: Optional[str] = None,
    remote_work: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """Получение списка компаний с фильтрацией"""
    
    query = db.query(User).outerjoin(CompanyProfile).filter(User.role == UserRole.COMPANY)
    
    # Поиск по названию компании или описанию
    if search:
        query = query.filter(
            (CompanyProfile.company_name.ilike(f"%{search}%")) |
            (CompanyProfile.description.ilike(f"%{search}%"))
        )
    
    # Фильтр по отрасли
    if industry:
        query = query.filter(CompanyProfile.industry == industry)
    
    # Фильтр по размеру
    if size:
        query = query.filter(CompanyProfile.company_size == size)
    
    # Фильтр по локации
    if location:
        query = query.filter(CompanyProfile.location.ilike(f"%{location}%"))
    
    # Фильтр по технологиям
    if technologies:
        tech_list = [tech.strip() for tech in technologies.split(",")]
        for tech in tech_list:
            query = query.filter(CompanyProfile.technologies.ilike(f"%{tech}%"))
    
    # Фильтр по удаленной работе
    if remote_work is not None:
        query = query.filter(CompanyProfile.remote_work == remote_work)
    
    companies = query.offset(skip).limit(limit).all()
    return companies

@router.post("/candidates/{candidate_id}/invite")
async def invite_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_company),
    db: Session = Depends(get_db)
) -> Any:
    """Отправка приглашения кандидату от компании"""
    
    # Проверяем, что текущий пользователь - компания
    if current_user.role != UserRole.COMPANY:
        raise ValidationError("Только компании могут отправлять приглашения")
    
    # Находим кандидата
    candidate = db.query(User).filter(
        User.id == candidate_id,
        User.role == UserRole.CANDIDATE
    ).first()
    
    if not candidate:
        raise NotFoundError("Кандидат не найден")
    
    # Проверяем, что у кандидата есть профиль
    if not candidate.candidate_profile:
        raise ValidationError("У кандидата нет профиля")
    
    # Проверяем, что у компании есть профиль
    if not current_user.company_profile:
        raise ValidationError("У компании нет профиля")
    
    # Находим первую доступную вакансию компании или создаем общее приглашение
    from app.models.job import Job, InterviewInvitation, InvitationStatus
    from datetime import datetime, timedelta
    
    # Ищем первую активную вакансию компании
    job = db.query(Job).filter(
        Job.company_id == current_user.company_profile.id,
        Job.status == "active"
    ).first()
    
    # Если нет активных вакансий, создаем общее приглашение без привязки к вакансии
    if not job:
        # Создаем временную вакансию для общего приглашения
        from app.models.job import JobStatus, JobType, ExperienceLevel
        job = Job(
            company_id=current_user.company_profile.id,
            title="Общее приглашение",
            description="Общее приглашение на интервью",
            requirements="Общие требования",
            responsibilities="Общие обязанности",
            job_type=JobType.FULL_TIME,
            experience_level=ExperienceLevel.MIDDLE,  # Устанавливаем средний уровень опыта
            status=JobStatus.ACTIVE,
            is_ai_interview_enabled=True,
            max_candidates=100,
            created_at=datetime.now()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
    
    # Проверяем, не было ли уже отправлено приглашение этому кандидату от этой компании
    existing_invitation = db.query(InterviewInvitation).filter(
        InterviewInvitation.candidate_id == candidate.candidate_profile.id,
        InterviewInvitation.job_id == job.id
    ).first()
    
    if existing_invitation:
        return {
            "message": f"Приглашение уже было отправлено кандидату {candidate.first_name} {candidate.last_name}",
            "candidate_id": candidate_id,
            "invitation_id": existing_invitation.id
        }
    
    # Создаем приглашение
    invitation = InterviewInvitation(
        job_id=job.id,
        candidate_id=candidate.candidate_profile.id,
        status=InvitationStatus.SENT,
        expires_at=datetime.now() + timedelta(days=7),  # Приглашение действует 7 дней
        interview_language="ru"
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return {
        "message": f"Приглашение отправлено кандидату {candidate.first_name} {candidate.last_name}",
        "candidate_id": candidate_id,
        "invitation_id": invitation.id,
        "job_title": job.title
    }

@router.post("/candidates/{candidate_id}/invite-recruiter")
async def invite_candidate_by_recruiter(
    candidate_id: int,
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> Any:
    """Отправка приглашения кандидату от рекрутера"""
    
    # Проверяем, что текущий пользователь - рекрутер или выше
    if current_user.role not in [UserRole.RECRUITER, UserRole.SENIOR_RECRUITER, UserRole.RECRUIT_LEAD]:
        raise ValidationError("Только рекрутеры могут отправлять приглашения")
    
    # Находим кандидата
    candidate = db.query(User).filter(
        User.id == candidate_id,
        User.role == UserRole.CANDIDATE
    ).first()
    
    if not candidate:
        raise NotFoundError("Кандидат не найден")
    
    # Проверяем, что у кандидата есть профиль
    if not candidate.candidate_profile:
        raise ValidationError("У кандидата нет профиля")
    
    # Создаем общее приглашение от рекрутера
    from app.models.job import Job, InterviewInvitation, InvitationStatus, JobStatus, JobType, ExperienceLevel
    from datetime import datetime, timedelta
    
    # Находим или создаем специальную компанию для рекрутеров
    recruiter_company = db.query(CompanyProfile).filter(
        CompanyProfile.company_name == "Recruit.ai - Рекрутеры"
    ).first()
    
    if not recruiter_company:
        # Создаем специального системного пользователя для рекрутеров
        system_user = db.query(User).filter(
            User.email == "system@recruit.ai"
        ).first()
        
        if not system_user:
            system_user = User(
                email="system@recruit.ai",
                hashed_password="$2b$12$dummy_hash_for_system_user",  # Dummy hash
                first_name="System",
                last_name="Recruiter",
                role=UserRole.COMPANY,
                is_active=True,
                is_verified=True
            )
            db.add(system_user)
            db.commit()
            db.refresh(system_user)
        
        # Создаем специальную компанию для рекрутеров
        recruiter_company = CompanyProfile(
            user_id=system_user.id,
            company_name="Recruit.ai - Рекрутеры",
            description="Специальная компания для приглашений от рекрутеров",
            industry="HR & Recruitment",
            company_size="50+",
            is_verified=True,
            subscription_plan="enterprise"
        )
        db.add(recruiter_company)
        db.commit()
        db.refresh(recruiter_company)
    
    # Создаем временную вакансию для приглашения от рекрутера
    job = Job(
        company_id=recruiter_company.id,
        title="Приглашение от рекрутера",
        description="Приглашение на собеседование от рекрутера",
        requirements="Общие требования",
        responsibilities="Общие обязанности",
        job_type=JobType.FULL_TIME,
        experience_level=ExperienceLevel.MIDDLE,
        status=JobStatus.ACTIVE,
        is_ai_interview_enabled=True,
        max_candidates=100,
        created_at=datetime.now()
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Проверяем, не было ли уже отправлено приглашение этому кандидату от этого рекрутера
    existing_invitation = db.query(InterviewInvitation).filter(
        InterviewInvitation.candidate_id == candidate.candidate_profile.id,
        InterviewInvitation.job_id == job.id
    ).first()
    
    if existing_invitation:
        return {
            "message": f"Приглашение уже было отправлено кандидату {candidate.first_name} {candidate.last_name}",
            "invitation_id": existing_invitation.id
        }
    
    # Создаем приглашение
    invitation = InterviewInvitation(
        job_id=job.id,
        candidate_id=candidate.candidate_profile.id,
        status=InvitationStatus.SENT,
        expires_at=datetime.now() + timedelta(days=7),  # Приглашение действует 7 дней
        interview_language="ru"
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return {
        "message": f"Приглашение отправлено кандидату {candidate.first_name} {candidate.last_name}",
        "candidate_id": candidate_id,
        "invitation_id": invitation.id,
        "job_title": job.title,
        "recruiter_name": f"{current_user.first_name} {current_user.last_name}"
    }

@router.post("/companies/{company_id}/apply")
async def apply_to_company(
    company_id: int,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Подача заявки в компанию от кандидата"""
    
    # Проверяем, что текущий пользователь - кандидат
    if current_user.role != UserRole.CANDIDATE:
        raise ValidationError("Только кандидаты могут подавать заявки")
    
    # Находим компанию
    company = db.query(User).filter(
        User.id == company_id,
        User.role == UserRole.COMPANY
    ).first()
    
    if not company:
        raise NotFoundError("Компания не найдена")
    
    # Здесь можно добавить логику создания заявки
    # Пока возвращаем успешный ответ
    
    return {
        "message": f"Заявка отправлена в компанию {company.first_name}",
        "company_id": company_id
    }

# ========== НОВЫЕ ЭНДПОИНТЫ ДЛЯ УПРАВЛЕНИЯ РОЛЯМИ И ПОТОКАМИ ==========

@router.post("/", response_model=UserBasic)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_company_owner),
    db: Session = Depends(get_db)
) -> UserBasic:
    """Создание нового пользователя (для владельцев компаний и администраторов)"""
    
    # Проверяем уникальность email
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ValidationError("Пользователь с таким email уже существует")
    
    # Хешируем пароль
    from app.core.security import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    
    # Создаем пользователя
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        phone=user_data.phone,
        stream_id=user_data.stream_id,
        is_active=True,
        is_verified=False
    )
    
    db.add(new_user)
    
    # Если создается Senior Recruiter, автоматически создаем для него поток
    if user_data.role == UserRole.SENIOR_RECRUITER:
        stream_name = f"Поток {new_user.first_name} {new_user.last_name}"
        stream = RecruitmentStream(
            name=stream_name,
            senior_recruiter_id=new_user.id,
            recruit_lead_id=current_user.id if current_user.role == UserRole.RECRUIT_LEAD else None
        )
        db.add(stream)
        db.flush()  # Получаем ID потока
        new_user.owned_stream = stream
    
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/recruiters", response_model=List[UserBasic])
async def get_recruiters(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    stream_id: Optional[int] = None,
    current_user: User = Depends(get_current_company_owner),
    db: Session = Depends(get_db)
) -> List[UserBasic]:
    """Получение списка рекрутеров"""
    
    query = db.query(User).filter(User.role.in_([
        UserRole.RECRUITER, UserRole.SENIOR_RECRUITER, UserRole.RECRUIT_LEAD
    ]))
    
    # Фильтрация по правам доступа
    if current_user.role == UserRole.SENIOR_RECRUITER:
        # Senior Recruiter видит только рекрутеров своего потока
        query = query.filter(
            (User.stream_id == current_user.owned_stream.id) |
            (User.id == current_user.id) |
            (User.role == UserRole.RECRUIT_LEAD)
        )
    
    # Поиск по имени или email
    if search:
        query = query.filter(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    # Фильтр по потоку
    if stream_id:
        query = query.filter(User.stream_id == stream_id)
    
    recruiters = query.offset(skip).limit(limit).all()
    return recruiters

@router.put("/{user_id}/role", response_model=UserBasic)
async def update_user_role(
    user_id: int,
    role_data: dict,  # {"role": "recruiter", "stream_id": 1}
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> UserBasic:
    """Обновление роли пользователя (только для администраторов)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Пользователь не найден")
    
    new_role = role_data.get("role")
    new_stream_id = role_data.get("stream_id")
    
    if new_role not in [role.value for role in UserRole]:
        raise ValidationError("Неверная роль")
    
    new_role_enum = UserRole(new_role)
    
    # Валидация stream_id
    if new_role_enum == UserRole.RECRUITER:
        if not new_stream_id:
            raise ValidationError("Для рекрутера необходимо указать поток")
        
        # Проверяем существование потока
        stream = db.query(RecruitmentStream).filter(RecruitmentStream.id == new_stream_id).first()
        if not stream:
            raise ValidationError("Поток не найден")
        
        user.stream_id = new_stream_id
    
    elif new_role_enum == UserRole.SENIOR_RECRUITER:
        # Для Senior Recruiter убираем stream_id и создаем новый поток
        user.stream_id = None
        
        # Проверяем, нет ли уже потока у этого пользователя
        existing_stream = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == user_id
        ).first()
        
        if not existing_stream:
            stream_name = f"Поток {user.first_name} {user.last_name}"
            stream = RecruitmentStream(
                name=stream_name,
                senior_recruiter_id=user_id,
                recruit_lead_id=current_user.id if current_user.role == UserRole.RECRUIT_LEAD else None
            )
            db.add(stream)
    
    elif new_role_enum in [UserRole.RECRUIT_LEAD, UserRole.ADMIN]:
        # Для руководителей убираем stream_id
        user.stream_id = None
    
    user.role = new_role_enum
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/streams/available", response_model=List[Stream])
async def get_available_streams(
    current_user: User = Depends(get_current_senior_or_lead),
    db: Session = Depends(get_db)
) -> List[Stream]:
    """Получение доступных потоков для назначения рекрутерам"""
    
    if current_user.role == UserRole.RECRUIT_LEAD:
        # Recruit Lead видит все потоки
        streams = db.query(RecruitmentStream).all()
    else:
        # Senior Recruiter видит только свой поток
        streams = db.query(RecruitmentStream).filter(
            RecruitmentStream.senior_recruiter_id == current_user.id
        ).all()
    
    return streams

@router.get("/profile/recruiter")
async def get_recruiter_profile(
    current_user: User = Depends(get_current_recruiter_or_above),
    db: Session = Depends(get_db)
) -> dict:
    """Получение профиля рекрутера с информацией о потоке"""
    
    profile_data = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role.value,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at
        }
    }
    
    # Добавляем информацию о потоке
    if current_user.role == UserRole.RECRUITER and current_user.stream:
        profile_data["stream"] = {
            "id": current_user.stream.id,
            "name": current_user.stream.name,
            "senior_recruiter": {
                "id": current_user.stream.senior_recruiter.id,
                "name": current_user.stream.senior_recruiter.full_name,
                "email": current_user.stream.senior_recruiter.email
            } if current_user.stream.senior_recruiter else None
        }
    elif current_user.role == UserRole.SENIOR_RECRUITER and current_user.owned_stream:
        profile_data["owned_stream"] = {
            "id": current_user.owned_stream.id,
            "name": current_user.owned_stream.name,
            "recruiters_count": len(current_user.owned_stream.recruiters),
            "recruiters": [
                {
                    "id": recruiter.id,
                    "name": recruiter.full_name,
                    "email": recruiter.email
                } for recruiter in current_user.owned_stream.recruiters
            ]
        }
    elif current_user.role == UserRole.RECRUIT_LEAD:
        # Для Recruit Lead загружаем все потоки
        streams = db.query(RecruitmentStream).options(
            db.joinedload(RecruitmentStream.recruiters),
            db.joinedload(RecruitmentStream.senior_recruiter)
        ).all()
        
        profile_data["supervised_streams"] = [
            {
                "id": stream.id,
                "name": stream.name,
                "senior_recruiter": {
                    "id": stream.senior_recruiter.id,
                    "name": stream.senior_recruiter.full_name,
                    "email": stream.senior_recruiter.email
                } if stream.senior_recruiter else None,
                "recruiters_count": len(stream.recruiters),
                "recruiters": [
                    {
                        "id": recruiter.id,
                        "name": recruiter.full_name,
                        "email": recruiter.email
                    } for recruiter in stream.recruiters
                ]
            } for stream in streams
        ]
    
    return profile_data

@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_company_owner),
    db: Session = Depends(get_db)
):
    """Удаление пользователя (для владельцев компаний и администраторов)"""
    
    # Находим пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Пользователь не найден")
    
    # Нельзя удалить самого себя
    if user.id == current_user.id:
        raise ValidationError("Нельзя удалить самого себя")
    
    # Удаляем пользователя
    db.delete(user)
    db.commit()
    
    return {"message": "Пользователь успешно удален"}
