#!/usr/bin/env python3
"""
Скрипт для создания новых таблиц в базе данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User, CandidateProfile, CompanyProfile, RecruitmentStream
from app.models.job import Job, JobApplication, InterviewInvitation

def create_tables():
    """Создание всех таблиц в базе данных"""
    try:
        print("Создание таблиц в базе данных...")
        Base.metadata.create_all(bind=engine)
        print("✅ Таблицы успешно созданы!")
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        return False
    return True

if __name__ == "__main__":
    create_tables()



