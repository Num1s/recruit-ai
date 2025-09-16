"""
API роуты для пользователей
"""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Any
import os
import uuid
from datetime import datetime

from ...core.database import get_db
from ...core.deps import get_current_active_user, get_current_candidate, get_current_company
from ...core.config import settings
from ...models.user import User, CandidateProfile, CompanyProfile
from ...schemas.user import (
    UserUpdate, CandidateProfileUpdate, CompanyProfileUpdate,
    CandidateWithProfile, CompanyWithProfile
)
from ...core.exceptions import ValidationError, NotFoundError

router = APIRouter()

@router.get("/profile/candidate", response_model=CandidateWithProfile)
async def get_candidate_profile(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Получение профиля кандидата"""
    
    # Загружаем профиль кандидата
    if not current_user.candidate_profile:
        # Создаем профиль если не существует
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(current_user)
    
    return current_user

@router.put("/profile/candidate", response_model=CandidateWithProfile)
async def update_candidate_profile(
    profile_data: CandidateProfileUpdate,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление профиля кандидата"""
    
    profile = current_user.candidate_profile
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    
    # Обновляем поля профиля
    for field, value in profile_data.dict(exclude_unset=True).items():
        if field in ["skills", "preferred_locations"] and value is not None:
            # Конвертируем списки в JSON строки
            import json
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/profile/company", response_model=CompanyWithProfile)
async def get_company_profile(
    current_user: User = Depends(get_current_company),
    db: Session = Depends(get_db)
) -> Any:
    """Получение профиля компании"""
    
    if not current_user.company_profile:
        raise NotFoundError("Профиль компании не найден")
    
    return current_user

@router.put("/profile/company", response_model=CompanyWithProfile)
async def update_company_profile(
    profile_data: CompanyProfileUpdate,
    current_user: User = Depends(get_current_company),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление профиля компании"""
    
    profile = current_user.company_profile
    if not profile:
        raise NotFoundError("Профиль компании не найден")
    
    # Обновляем поля профиля
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.put("/profile", response_model=dict)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Обновление основного профиля пользователя"""
    
    # Обновляем поля пользователя
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    
    return {"message": "Профиль успешно обновлен"}

@router.post("/upload/cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
) -> Any:
    """Загрузка резюме кандидата"""
    
    # Проверка типа файла
    if not file.filename.lower().endswith(tuple(settings.ALLOWED_FILE_EXTENSIONS)):
        raise ValidationError(
            f"Неподдерживаемый тип файла. Разрешены: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
        )
    
    # Проверка размера файла
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise ValidationError(f"Файл слишком большой. Максимальный размер: {settings.MAX_FILE_SIZE // (1024*1024)} МБ")
    
    # Создание уникального имени файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Создание директории для загрузок
    upload_dir = os.path.join(settings.UPLOAD_DIRECTORY, "cv")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Сохранение файла
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Обновление профиля кандидата
    profile = current_user.candidate_profile
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
    
    # Удаление старого файла если существует
    if profile.cv_url and os.path.exists(profile.cv_url):
        try:
            os.remove(profile.cv_url)
        except:
            pass
    
    profile.cv_filename = file.filename
    profile.cv_url = file_path
    profile.cv_uploaded_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Резюме успешно загружено",
        "filename": file.filename,
        "uploaded_at": profile.cv_uploaded_at
    }

@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Загрузка аватара пользователя"""
    
    # Проверка типа файла
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif"]
    if not file.filename.lower().endswith(tuple(allowed_extensions)):
        raise ValidationError(
            f"Неподдерживаемый тип файла. Разрешены: {', '.join(allowed_extensions)}"
        )
    
    # Проверка размера файла (максимум 5 МБ для изображений)
    max_image_size = 5 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_image_size:
        raise ValidationError("Файл слишком большой. Максимальный размер: 5 МБ")
    
    # Создание уникального имени файла
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Создание директории для загрузок
    upload_dir = os.path.join(settings.UPLOAD_DIRECTORY, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Сохранение файла
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Удаление старого аватара если существует
    if current_user.avatar_url and os.path.exists(current_user.avatar_url):
        try:
            os.remove(current_user.avatar_url)
        except:
            pass
    
    # Обновление пользователя
    current_user.avatar_url = file_path
    db.commit()
    
    return {
        "message": "Аватар успешно загружен",
        "avatar_url": f"/uploads/avatars/{unique_filename}"
    }




