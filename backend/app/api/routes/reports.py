"""
API роуты для отчетов
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/{candidate_id}")
async def get_candidate_report():
    """Получение отчета по кандидату"""
    return {"message": "Candidate report endpoint - TODO"}
