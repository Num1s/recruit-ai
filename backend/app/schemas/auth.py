"""
Pydantic схемы для аутентификации
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.user import UserRole

class Token(BaseModel):
    """Схема токена доступа"""
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class TokenData(BaseModel):
    """Данные токена"""
    user_id: Optional[int] = None
    email: Optional[str] = None

class LoginRequest(BaseModel):
    """Запрос на авторизацию"""
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    """Запрос на регистрацию"""
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole
    phone: Optional[str] = None
    
    # Дополнительные поля в зависимости от роли
    company_name: Optional[str] = None  # Для компаний

class PasswordResetRequest(BaseModel):
    """Запрос на сброс пароля"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Подтверждение сброса пароля"""
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    """Запрос на смену пароля"""
    current_password: str
    new_password: str
