#!/usr/bin/env python3
"""
Скрипт для проверки кандидатов в базе данных
"""

from app.core.database import SessionLocal
from app.models.user import User, CandidateProfile
import json

def main():
    db = SessionLocal()
    try:
        # Получаем всех кандидатов
        candidates = db.query(User).filter(User.role == "CANDIDATE").all()
        
        print(f'Всего кандидатов: {len(candidates)}')
        
        for candidate in candidates:
            print(f'\nКандидат: {candidate.first_name} {candidate.last_name} ({candidate.email})')
            print(f'  ID: {candidate.id}')
            print(f'  Active: {candidate.is_active}')
            print(f'  Verified: {candidate.is_verified}')
            
            if candidate.candidate_profile:
                profile = candidate.candidate_profile
                print(f'  Профиль существует: Да')
                print(f'  Experience: {profile.experience_years} лет')
                print(f'  Skills: {profile.skills}')
                print(f'  Location: {profile.location}')
                print(f'  Current position: {profile.current_position}')
            else:
                print(f'  Профиль существует: Нет')
        
        # Проверяем запрос с outerjoin
        print('\n--- Тестирование запроса с outerjoin ---')
        query = db.query(User).outerjoin(CandidateProfile).filter(User.role == "CANDIDATE")
        candidates_with_outerjoin = query.all()
        print(f'Кандидатов с outerjoin: {len(candidates_with_outerjoin)}')
        
        for candidate in candidates_with_outerjoin:
            print(f'  {candidate.first_name} {candidate.last_name} - профиль: {"Да" if candidate.candidate_profile else "Нет"}')
            
    except Exception as e:
        print(f'Ошибка: {e}')
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()


