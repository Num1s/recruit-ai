"""
API роуты для компаний
Управление вакансиями, кандидатами
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def get_company_dashboard():
    """Получение dashboard компании"""
    return {"message": "Company dashboard endpoint - TODO"}

@router.get("/candidates")
async def get_company_candidates():
    """Получение списка кандидатов компании"""
    return {"message": "Company candidates endpoint - TODO"}
