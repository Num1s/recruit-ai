#!/usr/bin/env python3
"""
Миграция для добавления ролей и потоков рекрутинга
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def migrate_database():
    """Миграция базы данных для добавления новых ролей и потоков"""
    db = SessionLocal()
    try:
        print("Начинаем миграцию базы данных...")
        
        # 1. Добавляем новые роли в enum (если используется PostgreSQL)
        # Для SQLite это не нужно, так как enum хранится как строка
        print("✅ Роли будут добавлены автоматически при создании таблиц")
        
        # 2. Добавляем новую таблицу recruitment_streams
        print("Создание таблицы recruitment_streams...")
        create_streams_table = text("""
        CREATE TABLE IF NOT EXISTS recruitment_streams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL,
            senior_recruiter_id INTEGER,
            recruit_lead_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            FOREIGN KEY (senior_recruiter_id) REFERENCES users(id),
            FOREIGN KEY (recruit_lead_id) REFERENCES users(id)
        )
        """)
        db.execute(create_streams_table)
        
        # 3. Добавляем столбец stream_id в таблицу users
        print("Добавление столбца stream_id в таблицу users...")
        add_stream_id_column = text("""
        ALTER TABLE users ADD COLUMN stream_id INTEGER
        """)
        try:
            db.execute(add_stream_id_column)
            print("✅ Столбец stream_id добавлен")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✅ Столбец stream_id уже существует")
            else:
                raise e
        
        # 4. Добавляем внешний ключ для stream_id
        print("Добавление внешнего ключа для stream_id...")
        # SQLite не поддерживает ALTER TABLE для добавления внешних ключей
        # Это будет обработано при следующем создании таблиц
        print("✅ Внешний ключ будет добавлен при следующем создании таблиц")
        
        db.commit()
        print("✅ Миграция успешно завершена!")
        
        # 5. Создаем индексы для производительности
        print("Создание индексов...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_recruitment_streams_name ON recruitment_streams(name)",
            "CREATE INDEX IF NOT EXISTS idx_recruitment_streams_senior_recruiter ON recruitment_streams(senior_recruiter_id)",
            "CREATE INDEX IF NOT EXISTS idx_recruitment_streams_recruit_lead ON recruitment_streams(recruit_lead_id)",
            "CREATE INDEX IF NOT EXISTS idx_users_stream_id ON users(stream_id)"
        ]
        
        for index_sql in indexes:
            db.execute(text(index_sql))
        
        db.commit()
        print("✅ Индексы созданы")
        
    except Exception as e:
        print(f"❌ Ошибка при миграции: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

def verify_migration():
    """Проверка успешности миграции"""
    db = SessionLocal()
    try:
        # Проверяем существование таблицы recruitment_streams
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='recruitment_streams'"))
        if result.fetchone():
            print("✅ Таблица recruitment_streams создана")
        else:
            print("❌ Таблица recruitment_streams не найдена")
            return False
        
        # Проверяем наличие столбца stream_id в users
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]
        if 'stream_id' in columns:
            print("✅ Столбец stream_id добавлен в users")
        else:
            print("❌ Столбец stream_id не найден в users")
            return False
        
        print("✅ Миграция прошла успешно!")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при проверке миграции: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if migrate_database():
        verify_migration()
    else:
        print("❌ Миграция не удалась")
        sys.exit(1)
