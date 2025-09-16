"""
Простой демо-сервер для Recruit.ai
Минимальная версия для демонстрации frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(
    title="Recruit.ai Demo API",
    description="Демо API для HR-платформы",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str
    phone: Optional[str] = None
    company_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict

# Моковые данные пользователей
mock_users = {}

@app.get("/")
async def root():
    """Главная страница API"""
    return {
        "message": "Добро пожаловать в Recruit.ai Demo API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Проверка состояния сервиса"""
    return {"status": "healthy", "service": "recruit-ai-demo"}

@app.post("/api/auth/register")
async def register(user_data: RegisterRequest):
    """Демо регистрация"""
    
    # Проверяем, не существует ли пользователь
    if user_data.email in mock_users:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    # Сохраняем пользователя
    mock_users[user_data.email] = {
        "id": len(mock_users) + 1,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "phone": user_data.phone,
        "company_name": user_data.company_name
    }
    
    user = mock_users[user_data.email]
    
    return {
        "access_token": f"demo_token_{user['id']}",
        "token_type": "bearer",
        "expires_in": 1800,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@app.post("/api/auth/login")
async def login(login_data: LoginRequest):
    """Демо авторизация"""
    
    # Простая проверка - любой пароль длиннее 3 символов подходит
    if len(login_data.password) < 3:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    # Если пользователя нет, создаем демо-пользователя
    if login_data.email not in mock_users:
        # Определяем роль по домену email
        role = "company" if "company" in login_data.email or "@corp" in login_data.email else "candidate"
        
        mock_users[login_data.email] = {
            "id": len(mock_users) + 1,
            "email": login_data.email,
            "first_name": "Демо",
            "last_name": "Пользователь",
            "role": role,
            "phone": None,
            "company_name": "Демо Компания" if role == "company" else None
        }
    
    user = mock_users[login_data.email]
    
    return {
        "access_token": f"demo_token_{user['id']}",
        "token_type": "bearer", 
        "expires_in": 1800,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@app.get("/api/auth/me")
async def get_current_user():
    """Получение текущего пользователя (демо)"""
    return {
        "id": 1,
        "email": "demo@recruit.ai",
        "first_name": "Демо",
        "last_name": "Пользователь",
        "role": "candidate"
    }

@app.post("/api/auth/logout")
async def logout():
    """Выход из системы"""
    return {"message": "Успешный выход из системы"}

@app.get("/api/users/profile/candidate")
async def get_candidate_profile():
    """Демо профиль кандидата"""
    return {
        "id": 1,
        "email": "demo@recruit.ai",
        "first_name": "Демо",
        "last_name": "Кандидат",
        "role": "candidate",
        "candidate_profile": {
            "id": 1,
            "summary": "Опытный разработчик",
            "experience_years": 5,
            "skills": ["Python", "React", "TypeScript"]
        }
    }

@app.get("/api/users/profile/company") 
async def get_company_profile():
    """Демо профиль компании"""
    return {
        "id": 1,
        "email": "demo@company.com",
        "first_name": "Демо",
        "last_name": "Компания",
        "role": "company",
        "company_profile": {
            "id": 1,
            "company_name": "Демо IT Компания",
            "description": "Ведущая IT компания Кыргызстана"
        }
    }

@app.post("/api/users/upload/cv")
async def upload_cv():
    """Демо загрузка CV"""
    return {
        "message": "Резюме успешно загружено",
        "filename": "demo_cv.pdf"
    }

# Запуск сервера
if __name__ == "__main__":
    print("🚀 Запуск Recruit.ai Demo Server...")
    print("📡 API будет доступен: http://localhost:8000")
    print("📊 Документация: http://localhost:8000/docs")
    
    uvicorn.run(
        "demo_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )



