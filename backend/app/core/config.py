"""
Конфигурация приложения
Настройки для базы данных, JWT, OpenAI и других сервисов
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./recruit_ai.db"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AWS (optional)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = "recruit-ai-files"
    
    # Application
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # File uploads
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".pdf", ".docx", ".doc"]
    UPLOAD_DIRECTORY: str = "uploads"
    
    # Interview settings
    INTERVIEW_DURATION_MINUTES: int = 10
    MAX_INTERVIEW_QUESTIONS: int = 8
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
