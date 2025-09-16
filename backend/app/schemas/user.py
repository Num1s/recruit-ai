"""
Pydantic схемы для пользователей
"""

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from ..models.user import UserRole

# Base schemas
class UserBase(BaseModel):
    """Базовая схема пользователя"""
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    phone: Optional[str] = None

class UserCreate(UserBase):
    """Схема создания пользователя"""
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Пароль должен содержать минимум 6 символов')
        return v

class UserUpdate(BaseModel):
    """Схема обновления пользователя"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    """Схема пользователя в базе данных"""
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserInDB):
    """Публичная схема пользователя"""
    pass

# Candidate Profile schemas
class CandidateProfileBase(BaseModel):
    """Базовая схема профиля кандидата"""
    summary: Optional[str] = None
    experience_years: Optional[int] = None
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    preferred_salary_min: Optional[int] = None
    preferred_salary_max: Optional[int] = None
    preferred_locations: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class CandidateProfileCreate(CandidateProfileBase):
    """Схема создания профиля кандидата"""
    pass

class CandidateProfileUpdate(CandidateProfileBase):
    """Схема обновления профиля кандидата"""
    pass

class CandidateProfile(CandidateProfileBase):
    """Схема профиля кандидата"""
    id: int
    user_id: int
    cv_filename: Optional[str] = None
    cv_url: Optional[str] = None
    cv_uploaded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @validator('skills', pre=True)
    def parse_skills(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                # Если не JSON, разбиваем по запятой
                return [skill.strip() for skill in v.split(',') if skill.strip()]
        return v
    
    @validator('preferred_locations', pre=True)
    def parse_preferred_locations(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                # Если не JSON, разбиваем по запятой
                return [loc.strip() for loc in v.split(',') if loc.strip()]
        return v
    
    class Config:
        from_attributes = True

# Company Profile schemas
class CompanyProfileBase(BaseModel):
    """Базовая схема профиля компании"""
    company_name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "Kyrgyzstan"
    technologies: Optional[List[str]] = None

class CompanyProfileCreate(CompanyProfileBase):
    """Схема создания профиля компании"""
    pass

class CompanyProfileUpdate(CompanyProfileBase):
    """Схема обновления профиля компании"""
    company_name: Optional[str] = None
    country: Optional[str] = None

class CompanyProfile(CompanyProfileBase):
    """Схема профиля компании"""
    id: int
    user_id: int
    logo_url: Optional[str] = None
    is_verified: bool
    subscription_plan: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @validator('technologies', pre=True)
    def parse_technologies(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                # Если не JSON, разбиваем по запятой
                return [tech.strip() for tech in v.split(',') if tech.strip()]
        return v
    
    class Config:
        from_attributes = True

# Combined schemas
class CandidateWithProfile(User):
    """Кандидат с профилем"""
    candidate_profile: Optional[CandidateProfile] = None

class CompanyWithProfile(User):
    """Компания с профилем"""
    company_profile: Optional[CompanyProfile] = None




