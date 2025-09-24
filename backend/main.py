"""
Recruit.ai - HR Platform Main Application
Главный модуль FastAPI приложения для HR-платформы
"""

# Standard library imports
import os
from contextlib import asynccontextmanager

# Third-party imports
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# Local imports
from app.core.config import settings
from app.core.database import engine, Base
from app.core.exceptions import setup_exception_handlers
from app.api.routes import auth, users, companies, jobs, interviews, reports, streams, analytics, integrations

# Загрузка переменных окружения с обработкой ошибок
try:
    load_dotenv()
except Exception as e:
    print(f"⚠️ Предупреждение: не удалось загрузить .env файл: {e}")
    print("Используются настройки по умолчанию")

# Constants
UPLOADS_DIR = "uploads"
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    print("🚀 Запуск Recruit.ai...")
    
    # Создание необходимых папок
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
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
app.include_router(streams.router, prefix="/api/streams", tags=["streams"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])

# Static files mounting (создаем папку если её нет)
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Frontend static files (React build)
if os.path.exists(FRONTEND_BUILD_DIR):
    static_dir = os.path.join(FRONTEND_BUILD_DIR, "static")
    if os.path.exists(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/api")
async def api_root():
    """API информация"""
    return {
        "message": "Добро пожаловать в Recruit.ai API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    """Проверка состояния сервиса"""
    return {"status": "healthy", "service": "recruit-ai"}

# SPA fallback - должен быть в самом конце
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """
    Обслуживание SPA - возвращает index.html для всех не-API роутов
    Это позволяет React Router обрабатывать клиентские роуты
    """
    # Если это API запрос, пропускаем
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
        # Эти роуты уже обработаны выше
        raise HTTPException(status_code=404, detail="Not found")
    
    # Путь к index.html
    index_file = os.path.join(FRONTEND_BUILD_DIR, "index.html")
    
    # Если файл существует, возвращаем его
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    # Если фронтенд не собран, возвращаем инструкции
    return {
        "message": "Фронтенд не найден",
        "instructions": [
            "1. Перейдите в папку frontend: cd frontend",
            "2. Соберите проект: npm run build",
            "3. Перезапустите сервер"
        ],
        "api_docs": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

