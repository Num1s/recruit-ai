"""
Recruit.ai - HR Platform Main Application
Главный модуль FastAPI приложения для HR-платформы
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, users, companies, jobs, interviews, reports
from app.core.exceptions import setup_exception_handlers

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    print("🚀 Запуск Recruit.ai...")
    
    # Создание таблиц базы данных
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Shutdown
    print("🔴 Остановка Recruit.ai...")

app = FastAPI(
    title="Recruit.ai API",
    description="Всесторонняя HR-платформа для IT и финтеха Кыргызстана",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# API routes
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

# Static files (for uploaded files)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    """Главная страница API"""
    return {
        "message": "Добро пожаловать в Recruit.ai API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    """Проверка состояния сервиса"""
    return {"status": "healthy", "service": "recruit-ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )




