#!/usr/bin/env python3
"""
Скрипт для проверки пользователей в базе данных
"""

import sqlite3
import os

def check_users():
    db_path = "recruit_ai.db"
    
    if not os.path.exists(db_path):
        print(f"База данных {db_path} не найдена.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Проверяем всех пользователей
        print("=== ВСЕ ПОЛЬЗОВАТЕЛИ ===")
        cursor.execute("SELECT id, email, first_name, last_name, role, is_active FROM users")
        users = cursor.fetchall()
        
        if not users:
            print("Пользователи не найдены.")
        else:
            for user in users:
                print(f"ID: {user[0]}, Email: {user[1]}, Имя: {user[2]} {user[3]}, Роль: {user[4]}, Активен: {user[5]}")
        
        print("\n=== КАНДИДАТЫ ===")
        cursor.execute("""
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, 
                   cp.experience_years, cp.skills, cp.current_position
            FROM users u
            LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
            WHERE u.role = 'candidate'
        """)
        candidates = cursor.fetchall()
        
        if not candidates:
            print("Кандидаты не найдены.")
        else:
            for candidate in candidates:
                print(f"ID: {candidate[0]}, Email: {candidate[1]}, Имя: {candidate[2]} {candidate[3]}")
                print(f"  Опыт: {candidate[5]} лет, Навыки: {candidate[6]}, Позиция: {candidate[7]}")
        
        print("\n=== КОМПАНИИ ===")
        cursor.execute("""
            SELECT u.id, u.email, u.first_name, u.last_name, u.role,
                   comp.company_name, comp.industry, comp.description
            FROM users u
            LEFT JOIN company_profiles comp ON u.id = comp.user_id
            WHERE u.role = 'company'
        """)
        companies = cursor.fetchall()
        
        if not companies:
            print("Компании не найдены.")
        else:
            for company in companies:
                print(f"ID: {company[0]}, Email: {company[1]}, Имя: {company[2]} {company[3]}")
                print(f"  Компания: {company[5]}, Отрасль: {company[6]}")
        
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_users()


