#!/usr/bin/env python3
"""
Скрипт для создания тестовых кандидатов в базе данных
"""

from app.core.database import SessionLocal
from app.models.user import User, CandidateProfile, UserRole
from app.core.security import get_password_hash
import json
from datetime import datetime

def create_test_candidates():
    """Создание тестовых кандидатов"""
    
    # Тестовые данные кандидатов
    test_candidates = [
        {
            "email": "ivan.petrov@example.com",
            "password": "password123",
            "first_name": "Иван",
            "last_name": "Петров",
            "summary": "Опытный Python разработчик с 5+ летним стажем. Специализируется на веб-разработке, Django, FastAPI, PostgreSQL.",
            "experience_years": 5,
            "current_position": "Senior Python Developer",
            "current_company": "TechCorp",
            "location": "Москва",
            "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS", "Git"],
            "preferred_salary_min": 150000,
            "preferred_salary_max": 250000,
            "availability": "available",
            "education": "МГУ, Факультет вычислительной математики и кибернетики",
            "languages": ["Русский", "Английский"],
            "achievements": "Участвовал в разработке высоконагруженных систем, команда из 10+ разработчиков",
            "linkedin_url": "https://linkedin.com/in/ivan-petrov",
            "github_url": "https://github.com/ivan-petrov"
        },
        {
            "email": "anna.smirnova@example.com",
            "password": "password123",
            "first_name": "Анна",
            "last_name": "Смирнова",
            "summary": "Frontend разработчик с опытом работы с React, Vue.js, TypeScript. Создаю современные пользовательские интерфейсы.",
            "experience_years": 3,
            "current_position": "Frontend Developer",
            "current_company": "WebStudio",
            "location": "Санкт-Петербург",
            "skills": ["JavaScript", "TypeScript", "React", "Vue.js", "HTML", "CSS", "Webpack", "Node.js"],
            "preferred_salary_min": 120000,
            "preferred_salary_max": 180000,
            "availability": "available",
            "education": "СПбГУ, Математико-механический факультет",
            "languages": ["Русский", "Английский", "Немецкий"],
            "achievements": "Разработала популярное React приложение с 50k+ пользователей",
            "linkedin_url": "https://linkedin.com/in/anna-smirnova",
            "github_url": "https://github.com/anna-smirnova"
        },
        {
            "email": "dmitry.kozlov@example.com",
            "password": "password123",
            "first_name": "Дмитрий",
            "last_name": "Козлов",
            "summary": "Full-stack разработчик с опытом в Java, Spring Boot, React. Работал с микросервисной архитектурой.",
            "experience_years": 4,
            "current_position": "Full-stack Developer",
            "current_company": "FinTech Solutions",
            "location": "Новосибирск",
            "skills": ["Java", "Spring Boot", "React", "PostgreSQL", "Redis", "Kubernetes", "Docker"],
            "preferred_salary_min": 140000,
            "preferred_salary_max": 220000,
            "availability": "available",
            "education": "НГУ, Факультет информационных технологий",
            "languages": ["Русский", "Английский"],
            "achievements": "Архитектор системы обработки платежей с высокой нагрузкой",
            "linkedin_url": "https://linkedin.com/in/dmitry-kozlov",
            "github_url": "https://github.com/dmitry-kozlov"
        },
        {
            "email": "elena.volkova@example.com",
            "password": "password123",
            "first_name": "Елена",
            "last_name": "Волкова",
            "summary": "DevOps инженер с опытом автоматизации развертывания и мониторинга. Работала с AWS, Azure, Kubernetes.",
            "experience_years": 6,
            "current_position": "Senior DevOps Engineer",
            "current_company": "CloudTech",
            "location": "Екатеринбург",
            "skills": ["Docker", "Kubernetes", "AWS", "Azure", "Terraform", "Ansible", "Jenkins", "Python"],
            "preferred_salary_min": 160000,
            "preferred_salary_max": 280000,
            "availability": "available",
            "education": "УрФУ, Институт радиоэлектроники и информационных технологий",
            "languages": ["Русский", "Английский"],
            "achievements": "Настроила CI/CD для команды из 50+ разработчиков, сократила время деплоя на 70%",
            "linkedin_url": "https://linkedin.com/in/elena-volkova",
            "github_url": "https://github.com/elena-volkova"
        },
        {
            "email": "mikhail.ivanov@example.com",
            "password": "password123",
            "first_name": "Михаил",
            "last_name": "Иванов",
            "summary": "Мобильный разработчик с опытом создания iOS и Android приложений. Специализируется на React Native и Flutter.",
            "experience_years": 3,
            "current_position": "Mobile Developer",
            "current_company": "MobileFirst",
            "location": "Казань",
            "skills": ["React Native", "Flutter", "Swift", "Kotlin", "JavaScript", "TypeScript", "Firebase"],
            "preferred_salary_min": 130000,
            "preferred_salary_max": 190000,
            "availability": "available",
            "education": "КФУ, Институт вычислительной математики и информационных технологий",
            "languages": ["Русский", "Английский", "Татарский"],
            "achievements": "Разработал приложение с 100k+ загрузок в App Store и Google Play",
            "linkedin_url": "https://linkedin.com/in/mikhail-ivanov",
            "github_url": "https://github.com/mikhail-ivanov"
        },
        {
            "email": "olga.sokolova@example.com",
            "password": "password123",
            "first_name": "Ольга",
            "last_name": "Соколова",
            "summary": "Data Scientist с опытом машинного обучения и анализа данных. Работала с Python, R, TensorFlow, PyTorch.",
            "experience_years": 4,
            "current_position": "Data Scientist",
            "current_company": "DataLab",
            "location": "Ростов-на-Дону",
            "skills": ["Python", "R", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "SQL"],
            "preferred_salary_min": 140000,
            "preferred_salary_max": 200000,
            "availability": "available",
            "education": "ЮФУ, Институт математики, механики и компьютерных наук",
            "languages": ["Русский", "Английский"],
            "achievements": "Разработала ML модель, увеличившую конверсию на 25%",
            "linkedin_url": "https://linkedin.com/in/olga-sokolova",
            "github_url": "https://github.com/olga-sokolova"
        },
        {
            "email": "sergey.morozov@example.com",
            "password": "password123",
            "first_name": "Сергей",
            "last_name": "Морозов",
            "summary": "Backend разработчик с опытом работы с Node.js, Go, микросервисами. Специализируется на высоконагруженных системах.",
            "experience_years": 5,
            "current_position": "Backend Developer",
            "current_company": "ScaleTech",
            "location": "Красноярск",
            "skills": ["Node.js", "Go", "PostgreSQL", "MongoDB", "Redis", "RabbitMQ", "Docker", "Kubernetes"],
            "preferred_salary_min": 150000,
            "preferred_salary_max": 240000,
            "availability": "available",
            "education": "СФУ, Институт космических и информационных технологий",
            "languages": ["Русский", "Английский"],
            "achievements": "Оптимизировал API, увеличив пропускную способность в 3 раза",
            "linkedin_url": "https://linkedin.com/in/sergey-morozov",
            "github_url": "https://github.com/sergey-morozov"
        },
        {
            "email": "tatyana.kuznetsova@example.com",
            "password": "password123",
            "first_name": "Татьяна",
            "last_name": "Кузнецова",
            "summary": "QA Engineer с опытом автоматизации тестирования. Работала с Selenium, Cypress, Python для тестирования.",
            "experience_years": 3,
            "current_position": "QA Engineer",
            "current_company": "QualityAssurance",
            "location": "Воронеж",
            "skills": ["Selenium", "Cypress", "Python", "Java", "Postman", "JIRA", "TestRail", "Docker"],
            "preferred_salary_min": 90000,
            "preferred_salary_max": 140000,
            "availability": "available",
            "education": "ВГУ, Факультет компьютерных наук",
            "languages": ["Русский", "Английский"],
            "achievements": "Создала автоматизированную систему тестирования, сократив время регрессии на 60%",
            "linkedin_url": "https://linkedin.com/in/tatyana-kuznetsova",
            "github_url": "https://github.com/tatyana-kuznetsova"
        }
    ]
    
    db = SessionLocal()
    created_count = 0
    
    try:
        for candidate_data in test_candidates:
            # Проверяем, существует ли уже такой кандидат
            existing_user = db.query(User).filter(User.email == candidate_data["email"]).first()
            if existing_user:
                print(f"Кандидат {candidate_data['email']} уже существует, пропускаем")
                continue
            
            # Создаем пользователя
            user = User(
                email=candidate_data["email"],
                hashed_password=get_password_hash(candidate_data["password"]),
                first_name=candidate_data["first_name"],
                last_name=candidate_data["last_name"],
                role=UserRole.CANDIDATE,
                is_active=True,
                is_verified=True,
                phone="+7" + "".join([str(i) for i in range(10)])  # Генерируем случайный номер
            )
            
            db.add(user)
            db.flush()  # Получаем ID пользователя
            
            # Создаем профиль кандидата
            candidate_profile = CandidateProfile(
                user_id=user.id,
                summary=candidate_data["summary"],
                experience_years=candidate_data["experience_years"],
                current_position=candidate_data["current_position"],
                current_company=candidate_data["current_company"],
                location=candidate_data["location"],
                skills=json.dumps(candidate_data["skills"], ensure_ascii=False),
                preferred_salary_min=candidate_data["preferred_salary_min"],
                preferred_salary_max=candidate_data["preferred_salary_max"],
                availability=candidate_data["availability"],
                education=candidate_data["education"],
                languages=json.dumps(candidate_data["languages"], ensure_ascii=False),
                achievements=candidate_data["achievements"],
                linkedin_url=candidate_data["linkedin_url"],
                github_url=candidate_data["github_url"]
            )
            
            db.add(candidate_profile)
            created_count += 1
            
            print(f"✅ Создан кандидат: {candidate_data['first_name']} {candidate_data['last_name']} ({candidate_data['email']})")
        
        db.commit()
        print(f"\n🎉 Успешно создано {created_count} тестовых кандидатов!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при создании кандидатов: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def main():
    print("🚀 Создание тестовых кандидатов...")
    create_test_candidates()
    
    # Проверяем результат
    print("\n📊 Проверка созданных кандидатов...")
    db = SessionLocal()
    try:
        candidates = db.query(User).filter(User.role == UserRole.CANDIDATE).all()
        print(f"Всего кандидатов в системе: {len(candidates)}")
        
        for candidate in candidates:
            profile_exists = "✅" if candidate.candidate_profile else "❌"
            print(f"  {profile_exists} {candidate.first_name} {candidate.last_name} ({candidate.email})")
            
    except Exception as e:
        print(f"Ошибка при проверке: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
