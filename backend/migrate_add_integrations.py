"""
Миграция для добавления таблиц интеграций
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.integration import (
    PlatformIntegration, ExternalCandidate, IntegrationLog, CandidateImport
)

def create_integration_tables():
    """Создание таблиц для интеграций"""
    
    # Создаем движок базы данных
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Создаем таблицы
        Base.metadata.create_all(bind=engine)
        print("✅ Таблицы интеграций успешно созданы")
        
        # Проверяем созданные таблицы
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name LIKE '%integration%' OR name LIKE '%external%'
            """))
            tables = result.fetchall()
            print(f"📋 Созданные таблицы: {[table[0] for table in tables]}")
            
    except Exception as e:
        print(f"❌ Ошибка создания таблиц: {e}")
        return False
    
    return True

def add_sample_integrations():
    """Добавление примеров интеграций"""
    
    from sqlalchemy.orm import sessionmaker
    from app.models.integration import IntegrationPlatform, IntegrationStatus
    from app.models.user import User, UserRole
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Находим первого администратора
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            print("⚠️ Администратор не найден, пропускаем создание примеров")
            return
        
        # Создаем примеры интеграций
        sample_integrations = [
            {
                "platform": IntegrationPlatform.LINKEDIN,
                "name": "LinkedIn Integration",
                "description": "Интеграция с LinkedIn для поиска IT-специалистов",
                "is_active": False,
                "auto_sync": True,
                "sync_interval_hours": 24,
                "search_keywords": ["Python", "React", "JavaScript", "Django", "FastAPI"],
                "search_locations": ["Москва", "Санкт-Петербург", "Удаленно"],
                "search_experience_min": 2,
                "search_experience_max": 10,
                "search_salary_min": 80000,
                "search_salary_max": 300000,
                "status": IntegrationStatus.PENDING,
                "created_by": admin.id
            },
            {
                "platform": IntegrationPlatform.HH_RU,
                "name": "HH.ru Integration",
                "description": "Интеграция с HeadHunter для поиска кандидатов",
                "is_active": False,
                "auto_sync": True,
                "sync_interval_hours": 12,
                "search_keywords": ["Frontend", "Backend", "Full Stack", "DevOps"],
                "search_locations": ["Москва", "Санкт-Петербург", "Новосибирск"],
                "search_experience_min": 1,
                "search_experience_max": 8,
                "search_salary_min": 60000,
                "search_salary_max": 250000,
                "status": IntegrationStatus.PENDING,
                "created_by": admin.id
            }
        ]
        
        for integration_data in sample_integrations:
            # Проверяем, не существует ли уже такая интеграция
            existing = db.query(PlatformIntegration).filter(
                PlatformIntegration.platform == integration_data["platform"]
            ).first()
            
            if not existing:
                integration = PlatformIntegration(**integration_data)
                db.add(integration)
                print(f"✅ Создана интеграция: {integration_data['name']}")
            else:
                print(f"⚠️ Интеграция {integration_data['name']} уже существует")
        
        db.commit()
        print("✅ Примеры интеграций добавлены")
        
    except Exception as e:
        print(f"❌ Ошибка добавления примеров: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Запуск миграции интеграций...")
    
    if create_integration_tables():
        add_sample_integrations()
        print("✅ Миграция завершена успешно")
    else:
        print("❌ Миграция завершена с ошибками")
