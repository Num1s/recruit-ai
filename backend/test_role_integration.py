#!/usr/bin/env python3
"""
Тестовый скрипт для проверки интеграции ролей и потоков рекрутинга
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json
from datetime import datetime

# Конфигурация API
API_BASE_URL = "http://localhost:8000/api"
HEADERS = {"Content-Type": "application/json"}

class RoleIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.tokens = {}
        self.users = {}
        self.streams = {}
    
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{status}] {message}")
    
    def test_api_health(self):
        """Проверка доступности API"""
        try:
            response = self.session.get(f"{API_BASE_URL}")
            if response.status_code == 200:
                self.log("✅ API доступен")
                return True
            else:
                self.log(f"❌ API недоступен: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Ошибка подключения к API: {e}", "ERROR")
            return False
    
    def create_test_user(self, email, password, role, first_name="Test", last_name="User"):
        """Создание тестового пользователя"""
        user_data = {
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "phone": "+996555123456"
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/auth/register", json=user_data)
            if response.status_code == 200:
                data = response.json()
                self.users[role] = {
                    "email": email,
                    "password": password,
                    "token": data.get("access_token"),
                    "user_data": data.get("user")
                }
                self.log(f"✅ Пользователь {role} создан: {email}")
                return True
            else:
                self.log(f"❌ Ошибка создания пользователя {role}: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Исключение при создании пользователя {role}: {e}", "ERROR")
            return False
    
    def login_user(self, email, password, role):
        """Вход пользователя в систему"""
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.tokens[role] = data.get("access_token")
                self.log(f"✅ Пользователь {role} вошел в систему")
                return True
            else:
                self.log(f"❌ Ошибка входа пользователя {role}: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Исключение при входе пользователя {role}: {e}", "ERROR")
            return False
    
    def set_auth_header(self, role):
        """Установка заголовка авторизации"""
        if role in self.tokens:
            self.session.headers.update({"Authorization": f"Bearer {self.tokens[role]}"})
            return True
        else:
            self.log(f"❌ Токен для роли {role} не найден", "ERROR")
            return False
    
    def test_stream_management(self):
        """Тестирование управления потоками"""
        self.log("🔍 Тестирование управления потоками...")
        
        # Тест 1: Создание потока (только для Recruit Lead)
        if "recruit_lead" in self.tokens:
            self.set_auth_header("recruit_lead")
            
            stream_data = {
                "name": "Тестовый поток Frontend",
                "senior_recruiter_id": self.users.get("senior_recruiter", {}).get("user_data", {}).get("id")
            }
            
            try:
                response = self.session.post(f"{API_BASE_URL}/streams/", json=stream_data)
                if response.status_code == 200:
                    data = response.json()
                    self.streams["test_stream"] = data
                    self.log("✅ Поток успешно создан")
                else:
                    self.log(f"❌ Ошибка создания потока: {response.text}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Исключение при создании потока: {e}", "ERROR")
                return False
        
        # Тест 2: Получение списка потоков
        try:
            response = self.session.get(f"{API_BASE_URL}/streams/")
            if response.status_code == 200:
                streams = response.json()
                self.log(f"✅ Получено {len(streams)} потоков")
            else:
                self.log(f"❌ Ошибка получения потоков: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Исключение при получении потоков: {e}", "ERROR")
            return False
        
        return True
    
    def test_user_management(self):
        """Тестирование управления пользователями"""
        self.log("🔍 Тестирование управления пользователями...")
        
        if "admin" not in self.tokens:
            self.log("⚠️ Пропуск теста управления пользователями - нет токена admin", "WARNING")
            return True
        
        self.set_auth_header("admin")
        
        # Тест создания пользователя с ролью recruiter
        user_data = {
            "email": "test.recruiter@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "Recruiter",
            "role": "recruiter",
            "stream_id": list(self.streams.values())[0].get("id") if self.streams else None
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/users/", json=user_data)
            if response.status_code == 200:
                self.log("✅ Пользователь-рекрутер создан")
            else:
                self.log(f"❌ Ошибка создания пользователя-рекрутера: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Исключение при создании пользователя-рекрутера: {e}", "ERROR")
            return False
        
        # Тест получения списка рекрутеров
        try:
            response = self.session.get(f"{API_BASE_URL}/users/recruiters")
            if response.status_code == 200:
                recruiters = response.json()
                self.log(f"✅ Получено {len(recruiters)} рекрутеров")
            else:
                self.log(f"❌ Ошибка получения рекрутеров: {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Исключение при получении рекрутеров: {e}", "ERROR")
            return False
        
        return True
    
    def test_analytics(self):
        """Тестирование аналитики"""
        self.log("🔍 Тестирование аналитики...")
        
        # Тест для Recruit Lead
        if "recruit_lead" in self.tokens:
            self.set_auth_header("recruit_lead")
            
            try:
                response = self.session.get(f"{API_BASE_URL}/analytics/dashboard")
                if response.status_code == 200:
                    data = response.json()
                    self.log("✅ Аналитика дашборда получена")
                else:
                    self.log(f"❌ Ошибка получения аналитики: {response.text}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Исключение при получении аналитики: {e}", "ERROR")
                return False
        
        return True
    
    def test_role_based_access(self):
        """Тестирование доступа на основе ролей"""
        self.log("🔍 Тестирование доступа на основе ролей...")
        
        # Тест: Recruiter не может создавать потоки
        if "recruiter" in self.tokens:
            self.set_auth_header("recruiter")
            
            stream_data = {"name": "Неавторизованный поток"}
            
            try:
                response = self.session.post(f"{API_BASE_URL}/streams/", json=stream_data)
                if response.status_code == 403:
                    self.log("✅ Recruiter корректно заблокирован от создания потоков")
                else:
                    self.log(f"❌ Recruiter получил неожиданный доступ: {response.status_code}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Исключение при тестировании доступа recruiter: {e}", "ERROR")
                return False
        
        return True
    
    def run_all_tests(self):
        """Запуск всех тестов"""
        self.log("🚀 Начало тестирования интеграции ролей и потоков")
        
        # Проверка доступности API
        if not self.test_api_health():
            return False
        
        # Создание тестовых пользователей
        test_users = [
            ("admin@test.com", "adminpass123", "admin"),
            ("recruit.lead@test.com", "leadpass123", "recruit_lead"),
            ("senior.recruiter@test.com", "seniorpass123", "senior_recruiter"),
            ("recruiter@test.com", "recruiterpass123", "recruiter"),
        ]
        
        for email, password, role in test_users:
            if not self.create_test_user(email, password, role):
                return False
            if not self.login_user(email, password, role):
                return False
        
        # Тестирование функциональности
        tests = [
            self.test_stream_management,
            self.test_user_management,
            self.test_analytics,
            self.test_role_based_access,
        ]
        
        for test in tests:
            if not test():
                return False
        
        self.log("🎉 Все тесты пройдены успешно!")
        return True

def main():
    """Главная функция"""
    tester = RoleIntegrationTester()
    
    try:
        success = tester.run_all_tests()
        if success:
            print("\n✅ ИНТЕГРАЦИЯ УСПЕШНА!")
            print("Все компоненты системы ролей и потоков работают корректно.")
        else:
            print("\n❌ ИНТЕГРАЦИЯ НЕУДАЧНА!")
            print("Обнаружены проблемы в системе ролей и потоков.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ Тестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

