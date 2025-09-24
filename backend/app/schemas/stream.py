"""
Pydantic схемы для потоков рекрутинга
"""

from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole

# Stream schemas
class StreamBase(BaseModel):
    """Базовая схема потока"""
    name: str
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Название потока должно содержать минимум 2 символа')
        return v.strip()

class StreamCreate(StreamBase):
    """Схема создания потока"""
    senior_recruiter_id: Optional[int] = None
    recruit_lead_id: Optional[int] = None

class StreamUpdate(BaseModel):
    """Схема обновления потока"""
    name: Optional[str] = None
    senior_recruiter_id: Optional[int] = None
    recruit_lead_id: Optional[int] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and (not v or len(v.strip()) < 2):
            raise ValueError('Название потока должно содержать минимум 2 символа')
        return v.strip() if v else v

class StreamInDB(StreamBase):
    """Схема потока в базе данных"""
    id: int
    senior_recruiter_id: Optional[int] = None
    recruit_lead_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Stream(StreamInDB):
    """Публичная схема потока"""
    pass

class StreamWithRecruiters(Stream):
    """Поток с информацией о рекрутерах"""
    recruiters: List["UserBasic"] = []
    senior_recruiter: Optional["UserBasic"] = None
    recruit_lead: Optional["UserBasic"] = None

# Import here to avoid circular imports
from app.schemas.user import UserBasic

# Update forward references
StreamWithRecruiters.model_rebuild()


