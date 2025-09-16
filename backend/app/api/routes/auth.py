"""
API роуты для аутентификации
Регистрация, авторизация, сброс пароля
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token
from ...core.config import settings
from ...core.deps import get_current_active_user
from ...models.user import User, CandidateProfile, CompanyProfile, UserRole
from ...schemas.auth import (
    Token, LoginRequest, RegisterRequest, 
    PasswordResetRequest, ChangePasswordRequest
)
from ...schemas.user import User as UserSchema
from ...core.exceptions import AuthenticationError, ValidationError

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Регистрация нового пользователя"""
    
    # Проверка существования пользователя
    if db.query(User).filter(User.email == user_data.email).first():
        raise ValidationError("Пользователь с таким email уже существует")
    
    # Создание пользователя
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        phone=user_data.phone
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Создание профиля в зависимости от роли
    if user_data.role == UserRole.CANDIDATE:
        profile = CandidateProfile(user_id=user.id)
        db.add(profile)
    elif user_data.role == UserRole.COMPANY:
        if not user_data.company_name:
            raise ValidationError("Название компании обязательно")
        
        profile = CompanyProfile(
            user_id=user.id,
            company_name=user_data.company_name
        )
        db.add(profile)
    
    db.commit()
    
    # Создание токена доступа
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value
        }
    }

@router.post("/login", response_model=Token)
async def login(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Авторизация пользователя"""
    
    # Поиск пользователя
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise AuthenticationError("Неверный email или пароль")
    
    if not user.is_active:
        raise AuthenticationError("Аккаунт заблокирован")
    
    # Создание токена доступа
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value
        }
    }

@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Авторизация через форму (для совместимости с OAuth2)"""
    
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value
        }
    }

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Получение информации о текущем пользователе"""
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Смена пароля"""
    
    # Проверка текущего пароля
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise AuthenticationError("Неверный текущий пароль")
    
    # Обновление пароля
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Пароль успешно изменен"}

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Выход из системы"""
    # В простой реализации просто возвращаем успех
    # В продакшене можно добавить blacklist для токенов
    return {"message": "Успешный выход из системы"}

@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Обновление токена доступа"""
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.id, "email": current_user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }




