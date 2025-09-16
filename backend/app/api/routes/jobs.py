"""
API роуты для вакансий
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_jobs():
    """Получение списка вакансий"""
    return {"message": "Jobs list endpoint - TODO"}

@router.post("/")
async def create_job():
    """Создание новой вакансии"""
    return {"message": "Create job endpoint - TODO"}




