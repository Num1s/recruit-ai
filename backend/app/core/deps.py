"""
Зависимости FastAPI
Аутентификация, авторизация, база данных
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .security import verify_token
from ..models.user import User, UserRole
from ..core.exceptions import AuthenticationError, AuthorizationError

# HTTP Bearer для получения токена из заголовков
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Получение текущего пользователя по JWT токену"""
    try:
        token_data = verify_token(credentials.credentials)
        user = db.query(User).filter(User.id == token_data["user_id"]).first()
        
        if user is None:
            raise AuthenticationError("Пользователь не найден")
        
        if not user.is_active:
            raise AuthenticationError("Аккаунт заблокирован")
            
        return user
    except Exception as e:
        raise AuthenticationError("Неверный токен доступа")

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Получение активного пользователя"""
    if not current_user.is_active:
        raise AuthenticationError("Аккаунт заблокирован")
    return current_user

def get_current_candidate(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущего кандидата"""
    if current_user.role != UserRole.CANDIDATE:
        raise AuthorizationError("Доступ только для кандидатов")
    return current_user

def get_current_company(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущей компании"""
    if current_user.role != UserRole.COMPANY:
        raise AuthorizationError("Доступ только для компаний")
    return current_user

def get_current_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Получение текущего администратора"""
    if current_user.role != UserRole.ADMIN:
        raise AuthorizationError("Доступ только для администраторов")
    return current_user

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Получение пользователя (опционально)"""
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials, db)
    except:
        return None
