"""
Модели интервью и AI-анализа
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class InterviewSession(Base):
    """Модель сессии интервью"""
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(Integer, ForeignKey("interview_invitations.id"), unique=True, nullable=False)
    
    # Основная информация
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Файлы и записи
    video_url = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    
    # Настройки интервью
    language = Column(String, default="ru")
    questions_asked = Column(JSON, nullable=True)  # Список заданных вопросов
    
    # Статус обработки
    is_processed = Column(Boolean, default=False)
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    invitation = relationship("InterviewInvitation", back_populates="interview_session")
    ai_analysis = relationship("AIAnalysis", back_populates="interview_session", uselist=False)

class AIAnalysis(Base):
    """Модель AI-анализа интервью"""
    __tablename__ = "ai_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_session_id = Column(Integer, ForeignKey("interview_sessions.id"), unique=True, nullable=False)
    
    # Общая оценка
    overall_score = Column(Float, nullable=True)  # 0-5
    recommendation = Column(String, nullable=True)  # "recommend", "consider", "do_not_recommend"
    summary = Column(Text, nullable=True)
    
    # Детальные оценки
    technical_skills_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)
    cultural_fit_score = Column(Float, nullable=True)
    
    # Структурированный анализ (JSON)
    strengths = Column(JSON, nullable=True)  # Список сильных сторон
    weaknesses = Column(JSON, nullable=True)  # Список слабых сторон
    recommendations_details = Column(JSON, nullable=True)  # Детальные рекомендации
    
    # Assessment Rubrics
    assessment_rubrics = Column(JSON, nullable=True)  # Детальные оценки по критериям
    
    # Communication Skills
    grammar_score = Column(Float, nullable=True)
    comprehension_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    vocabulary_score = Column(Float, nullable=True)
    coherence_score = Column(Float, nullable=True)
    
    # Cognitive Insights
    logical_reasoning_score = Column(Float, nullable=True)
    critical_thinking_score = Column(Float, nullable=True)
    big_picture_thinking_score = Column(Float, nullable=True)
    insightfulness_score = Column(Float, nullable=True)
    clarity_score = Column(Float, nullable=True)
    
    # Integrity Signals
    multiple_faces_detected = Column(Boolean, default=False)
    face_out_of_view = Column(Boolean, default=False)
    eye_contact_quality = Column(String, nullable=True)  # "strong", "neutral", "weak"
    general_expression = Column(String, nullable=True)  # "positive", "neutral", "negative"
    
    # CV Analysis
    cv_status = Column(String, nullable=True)  # "confirmed", "suspicious", "not_found"
    certificates_verified = Column(JSON, nullable=True)  # Список проверенных сертификатов
    timeline_analysis = Column(Text, nullable=True)
    digital_footprint = Column(JSON, nullable=True)  # Найденные профили и данные
    
    # Red Flags
    red_flags = Column(JSON, nullable=True)  # Список выявленных проблем
    
    # Candidate Attributes
    learning_velocity_score = Column(Float, nullable=True)
    drive_initiative_score = Column(Float, nullable=True)
    intellectual_ability_score = Column(Float, nullable=True)
    creative_thinking_score = Column(Float, nullable=True)
    attention_to_detail_score = Column(Float, nullable=True)
    leadership_potential_score = Column(Float, nullable=True)
    entrepreneurial_spirit_score = Column(Float, nullable=True)
    estimated_career_potential = Column(String, nullable=True)  # "high", "medium", "low"
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    interview_session = relationship("InterviewSession", back_populates="ai_analysis")

class InterviewQuestion(Base):
    """Модель вопросов интервью"""
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Основная информация
    question_text = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # "technical", "behavioral", "cultural"
    difficulty_level = Column(String, nullable=False)  # "junior", "middle", "senior"
    
    # Настройки
    is_active = Column(Boolean, default=True)
    language = Column(String, default="ru")
    
    # Метаданные
    tags = Column(JSON, nullable=True)  # ["python", "algorithms", "leadership"]
    expected_duration_seconds = Column(Integer, default=120)
    
    # Временные метки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
