from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class InterviewReport(Base):
    """Модель отчета по интервью"""
    __tablename__ = "interview_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(Integer, ForeignKey("interview_invitations.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    # Статус и временные метки
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Результаты анализа
    overall_score = Column(Float, nullable=True)  # Общая оценка (0-100)
    technical_score = Column(Float, nullable=True)  # Техническая оценка
    communication_score = Column(Float, nullable=True)  # Оценка коммуникации
    experience_score = Column(Float, nullable=True)  # Оценка опыта
    
    # Детальный анализ
    strengths = Column(JSON, nullable=True)  # Сильные стороны
    weaknesses = Column(JSON, nullable=True)  # Слабые стороны
    recommendations = Column(JSON, nullable=True)  # Рекомендации
    detailed_analysis = Column(Text, nullable=True)  # Детальный анализ
    
    # Дополнительные данные
    interview_duration = Column(Integer, nullable=True)  # Длительность в секундах
    questions_answered = Column(Integer, nullable=True)  # Количество отвеченных вопросов
    ai_notes = Column(Text, nullable=True)  # Заметки ИИ
    
    # Relationships
    invitation = relationship("InterviewInvitation", back_populates="report")
    candidate = relationship("CandidateProfile", back_populates="interview_reports")
    job = relationship("Job", back_populates="interview_reports")
