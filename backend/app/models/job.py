"""
Модели вакансий и приглашений на интервью
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class JobStatus(enum.Enum):
    """Статусы вакансий"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"

class JobType(enum.Enum):
    """Типы занятости"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"

class ExperienceLevel(enum.Enum):
    """Уровни опыта"""
    JUNIOR = "junior"
    MIDDLE = "middle"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"

class Job(Base):
    """Модель вакансии"""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company_profiles.id"), nullable=False)
    
    # Основная информация
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)
    
    # Параметры вакансии
    job_type = Column(Enum(JobType), default=JobType.FULL_TIME)
    experience_level = Column(Enum(ExperienceLevel), nullable=False)
    location = Column(String, nullable=True)
    is_remote = Column(Boolean, default=False)
    
    # Зарплата
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String, default="KGS")
    
    # Навыки и технологии
    required_skills = Column(JSON, nullable=True)  # ["Python", "FastAPI", ...]
    nice_to_have_skills = Column(JSON, nullable=True)
    
    # Статус и настройки
    status = Column(Enum(JobStatus), default=JobStatus.DRAFT)
    is_ai_interview_enabled = Column(Boolean, default=True)
    max_candidates = Column(Integer, default=100)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    company = relationship("CompanyProfile", back_populates="jobs")
    job_applications = relationship("JobApplication", back_populates="job")
    interview_invitations = relationship("InterviewInvitation", back_populates="job")
    interview_reports = relationship("InterviewReport", back_populates="job")

class InvitationStatus(enum.Enum):
    """Статусы приглашений на интервью"""
    SENT = "sent"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    EXPIRED = "expired"
    DECLINED = "declined"

class JobApplicationStatus(enum.Enum):
    """Статусы откликов на вакансии"""
    APPLIED = "applied"
    REVIEWED = "reviewed"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class JobApplication(Base):
    """Модель отклика на вакансию"""
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    
    # Статус и временные метки
    status = Column(Enum(JobApplicationStatus), default=JobApplicationStatus.APPLIED)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    interview_scheduled_at = Column(DateTime(timezone=True), nullable=True)
    interview_completed_at = Column(DateTime(timezone=True), nullable=True)
    decision_at = Column(DateTime(timezone=True), nullable=True)
    
    # Дополнительная информация
    cover_letter = Column(Text, nullable=True)
    expected_salary = Column(Integer, nullable=True)
    availability_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    job = relationship("Job", back_populates="job_applications")
    candidate = relationship("CandidateProfile", back_populates="job_applications")
    interview_invitations = relationship("InterviewInvitation", back_populates="application")

class InterviewInvitation(Base):
    """Модель приглашения на интервью"""
    __tablename__ = "interview_invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=True)
    
    # Статус и временные метки
    status = Column(Enum(InvitationStatus), default=InvitationStatus.SENT)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)  # Планируемое время интервью
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Настройки интервью
    interview_language = Column(String, default="ru")
    custom_questions = Column(JSON, nullable=True)  # Дополнительные вопросы от компании
    
    # Уникальная ссылка для доступа
    access_token = Column(String, unique=True, nullable=True, index=True)
    
    # Relationships
    job = relationship("Job", back_populates="interview_invitations")
    candidate = relationship("CandidateProfile", back_populates="interview_invitations")
    application = relationship("JobApplication", back_populates="interview_invitations")
    report = relationship("InterviewReport", back_populates="invitation", uselist=False)
    interview_session = relationship("InterviewSession", back_populates="invitation", uselist=False)




