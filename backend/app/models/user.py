"""
Модели пользователей
Кандидаты и представители компаний
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class UserRole(enum.Enum):
    """Роли пользователей"""
    CANDIDATE = "candidate"
    COMPANY = "company"
    ADMIN = "admin"

class User(Base):
    """Базовая модель пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class CandidateProfile(Base):
    """Профиль кандидата"""
    __tablename__ = "candidate_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Основная информация
    summary = Column(Text, nullable=True)
    experience_years = Column(Integer, nullable=True)
    current_position = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    # Навыки и предпочтения
    skills = Column(Text, nullable=True)  # JSON array as text
    preferred_salary_min = Column(Integer, nullable=True)
    preferred_salary_max = Column(Integer, nullable=True)
    preferred_locations = Column(Text, nullable=True)  # JSON array as text
    
    # CV информация
    cv_filename = Column(String, nullable=True)
    cv_url = Column(String, nullable=True)
    cv_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Социальные сети
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    interview_invitations = relationship("InterviewInvitation", back_populates="candidate")

class CompanyProfile(Base):
    """Профиль компании"""
    __tablename__ = "company_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Основная информация
    company_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)  # "1-10", "11-50", etc.
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    
    # Контактная информация
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, default="Kyrgyzstan")
    
    # Настройки
    is_verified = Column(Boolean, default=False)
    subscription_plan = Column(String, default="basic")  # basic, premium, enterprise
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="company_profile")
    jobs = relationship("Job", back_populates="company")




