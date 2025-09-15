"""
Обработчики исключений для FastAPI
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

class RecruitAIException(Exception):
    """Базовое исключение для Recruit.ai"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthenticationError(RecruitAIException):
    """Ошибка аутентификации"""
    def __init__(self, message: str = "Неверные учетные данные"):
        super().__init__(message, 401)

class AuthorizationError(RecruitAIException):
    """Ошибка авторизации"""
    def __init__(self, message: str = "Недостаточно прав"):
        super().__init__(message, 403)

class NotFoundError(RecruitAIException):
    """Ресурс не найден"""
    def __init__(self, message: str = "Ресурс не найден"):
        super().__init__(message, 404)

class ValidationError(RecruitAIException):
    """Ошибка валидации данных"""
    def __init__(self, message: str = "Некорректные данные"):
        super().__init__(message, 422)

def setup_exception_handlers(app: FastAPI):
    """Настройка обработчиков исключений"""
    
    @app.exception_handler(RecruitAIException)
    async def recruit_ai_exception_handler(request: Request, exc: RecruitAIException):
        logger.error(f"RecruitAI Error: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.message,
                "type": exc.__class__.__name__
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTP Error {exc.status_code}: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.detail,
                "type": "HTTPException"
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation Error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "message": "Ошибка валидации данных",
                "details": exc.errors(),
                "type": "ValidationError"
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "Внутренняя ошибка сервера",
                "type": "InternalServerError"
            }
        )
