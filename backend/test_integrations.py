"""
Тестирование интеграций с внешними платформами
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.core.config import settings
from app.services.integration_service import IntegrationService
from app.schemas.integration import (
    PlatformIntegrationCreate, SearchCandidatesRequest, ImportCandidateRequest
)
from app.models.integration import IntegrationPlatform

# Создаем сессию базы данных
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def test_integration_service():
    """Тестирование сервиса интеграций"""
    
    db = SessionLocal()
    service = IntegrationService(db)
    
    try:
        print("🧪 Тестирование сервиса интеграций...")
        
        # 1. Получение списка интеграций
        print("\n1. Получение списка интеграций...")
        integrations = await service.get_integrations()
        print(f"   Найдено интеграций: {len(integrations)}")
        for integration in integrations:
            print(f"   - {integration.name} ({integration.platform.value}) - {integration.status.value}")
        
        # 2. Создание тестовой интеграции
        print("\n2. Создание тестовой интеграции...")
        test_integration_data = PlatformIntegrationCreate(
            platform=IntegrationPlatform.LINKEDIN,
            name="Test LinkedIn Integration",
            description="Тестовая интеграция с LinkedIn",
            is_active=True,
            auto_sync=True,
            sync_interval_hours=24,
            search_keywords=["Python", "React"],
            search_locations=["Москва"],
            search_experience_min=2,
            search_experience_max=5,
            search_salary_min=100000,
            search_salary_max=200000
        )
        
        # Находим первого пользователя для created_by
        from app.models.user import User
        user = db.query(User).first()
        if not user:
            print("   ❌ Пользователи не найдены, пропускаем создание")
        else:
            try:
                test_integration = await service.create_integration(test_integration_data, user.id)
                print(f"   ✅ Создана интеграция: {test_integration.name} (ID: {test_integration.id})")
                
                # 3. Поиск кандидатов
                print("\n3. Поиск кандидатов...")
                search_request = SearchCandidatesRequest(
                    platform=IntegrationPlatform.LINKEDIN,
                    keywords=["Python", "Django"],
                    locations=["Москва"],
                    experience_min=2,
                    experience_max=5,
                    limit=10
                )
                
                candidates = await service.search_candidates(search_request)
                print(f"   Найдено кандидатов: {len(candidates)}")
                for candidate in candidates:
                    print(f"   - {candidate.first_name} {candidate.last_name} ({candidate.platform.value})")
                
                # 4. Получение внешних кандидатов
                print("\n4. Получение внешних кандидатов...")
                external_candidates = await service.get_external_candidates(limit=10)
                print(f"   Всего внешних кандидатов: {len(external_candidates)}")
                
                # 5. Импорт кандидата (если есть кандидаты)
                if external_candidates:
                    print("\n5. Тестирование импорта кандидата...")
                    candidate_to_import = external_candidates[0]
                    if not candidate_to_import.is_imported:
                        import_request = ImportCandidateRequest(
                            external_candidate_id=candidate_to_import.id,
                            create_internal_user=True,
                            import_notes="Тестовый импорт"
                        )
                        
                        internal_user = await service.import_candidate(import_request, user.id)
                        print(f"   ✅ Кандидат импортирован: {internal_user.full_name} (ID: {internal_user.id})")
                    else:
                        print(f"   ⚠️ Кандидат {candidate_to_import.first_name} уже импортирован")
                
                # 6. Синхронизация интеграции
                print("\n6. Тестирование синхронизации...")
                try:
                    sync_result = await service.sync_integration(test_integration.id)
                    print(f"   ✅ Синхронизация завершена: {sync_result}")
                except Exception as e:
                    print(f"   ⚠️ Ошибка синхронизации: {e}")
                
                # 7. Получение логов
                print("\n7. Получение логов интеграции...")
                logs = await service.get_integration_logs(test_integration.id, limit=5)
                print(f"   Найдено логов: {len(logs)}")
                for log in logs:
                    print(f"   - {log.operation_type}: {log.status} - {log.message}")
                
                # 8. Удаление тестовой интеграции
                print("\n8. Удаление тестовой интеграции...")
                await service.delete_integration(test_integration.id)
                print(f"   ✅ Интеграция удалена")
                
            except Exception as e:
                print(f"   ❌ Ошибка: {e}")
        
        print("\n✅ Тестирование завершено")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
    finally:
        db.close()

async def test_api_endpoints():
    """Тестирование API endpoints"""
    
    print("\n🌐 Тестирование API endpoints...")
    
    try:
        import requests
        
        base_url = "http://localhost:8000/api"
        
        # Получаем токен (нужно будет залогиниться)
        print("   ⚠️ Для тестирования API нужна авторизация")
        print("   Запустите сервер и авторизуйтесь для полного тестирования")
        
        # Тестируем доступность endpoints
        endpoints = [
            "/integrations/",
            "/integrations/platforms/supported",
            "/integrations/stats/overview"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                print(f"   {endpoint}: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"   {endpoint}: ❌ {e}")
        
    except ImportError:
        print("   ⚠️ requests не установлен, пропускаем тестирование API")

def main():
    """Главная функция тестирования"""
    
    print("🚀 Запуск тестирования интеграций...")
    print(f"📊 База данных: {settings.DATABASE_URL}")
    
    # Запускаем асинхронные тесты
    asyncio.run(test_integration_service())
    
    # Запускаем тесты API
    asyncio.run(test_api_endpoints())
    
    print("\n🎉 Тестирование завершено!")

if __name__ == "__main__":
    main()
