#!/usr/bin/env python3
"""
Скрипт для проверки структуры базы данных
"""

import sqlite3

def check_database():
    """Проверка структуры базы данных"""
    conn = sqlite3.connect('recruit_ai.db')
    cursor = conn.cursor()
    
    print("🔍 Проверка структуры базы данных...")
    print("=" * 50)
    
    # Получаем список всех таблиц
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"📋 Созданные таблицы ({len(tables)}):")
    for table in tables:
        print(f"  ✅ {table[0]}")
    
    print("\n" + "=" * 50)
    
    # Проверяем таблицу recruitment_streams
    print("🔍 Структура таблицы recruitment_streams:")
    cursor.execute("PRAGMA table_info(recruitment_streams)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    print("\n" + "=" * 50)
    
    # Проверяем таблицу users
    print("🔍 Структура таблицы users (ключевые поля):")
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    for col in columns:
        if col[1] in ['id', 'email', 'role', 'stream_id']:
            print(f"  - {col[1]} ({col[2]})")
    
    print("\n" + "=" * 50)
    
    # Проверяем внешние ключи
    print("🔗 Внешние ключи:")
    cursor.execute("PRAGMA foreign_key_list(users)")
    fks = cursor.fetchall()
    for fk in fks:
        print(f"  - users.{fk[3]} -> {fk[2]}.{fk[4]}")
    
    print("\n" + "=" * 50)
    
    # Проверяем индексы
    print("📊 Индексы:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%stream%'")
    indexes = cursor.fetchall()
    for idx in indexes:
        print(f"  - {idx[0]}")
    
    conn.close()
    print("\n✅ Проверка завершена!")

if __name__ == "__main__":
    check_database()

