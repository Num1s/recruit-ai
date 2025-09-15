"""
API роуты для интервью
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/invitations")
async def get_interview_invitations():
    """Получение приглашений на интервью"""
    return {"message": "Interview invitations endpoint - TODO"}

@router.post("/start")
async def start_interview():
    """Начало интервью"""
    return {"message": "Start interview endpoint - TODO"}
