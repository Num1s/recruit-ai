# 🚀 Быстрый старт Recruit.ai

## Минимальная установка для демонстрации

### 1. Клонирование и подготовка

```bash
# Переход в директорию проекта (если еще не в ней)
cd recruit-ai

# Для Windows PowerShell:
.\start.ps1

# Для Linux/Mac:
./start.sh
```

### 2. Быстрый запуск без базы данных (для демо)

Если у вас нет PostgreSQL, можно запустить проект с SQLite для демонстрации:

#### Backend:
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-jose passlib python-multipart

# Создать простой .env файл:
echo "DATABASE_URL=sqlite:///./recruit_ai.db" > .env
echo "SECRET_KEY=demo-secret-key" >> .env

python main.py
```

#### Frontend:
```bash
# В новом терминале, в корневой папке:
npm install
npm start
```

### 3. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Документация**: http://localhost:8000/api/docs

### 4. Тестовые аккаунты

Создайте аккаунты через интерфейс:

**Кандидат:**
- Email: candidate@test.com
- Пароль: 123456
- Роль: Кандидат

**Компания:**
- Email: company@test.com  
- Пароль: 123456
- Роль: Компания
- Название: Тестовая IT компания

## 🎯 Демонстрация функционала

### Для кандидата:
1. Зарегистрируйтесь как кандидат
2. Загрузите резюме (любой PDF/DOCX файл)
3. Посмотрите на моковые приглашения на интервью
4. Пройдите демо-интервью (разрешите доступ к камере/микрофону)

### Для компании:
1. Зарегистрируйтесь как компания
2. Посмотрите dashboard с кандидатами
3. Откройте детальный отчет по кандидату
4. Изучите различные вкладки анализа

## 🔧 Полная установка (с PostgreSQL)

### Требования:
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+

### Установка PostgreSQL:

**Windows:**
1. Скачайте с https://www.postgresql.org/download/windows/
2. Установите с настройками по умолчанию
3. Запомните пароль для пользователя `postgres`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Настройка базы данных:
```bash
# Создание пользователя и базы данных
sudo -u postgres psql

CREATE USER recruit_ai_user WITH PASSWORD 'your_password';
CREATE DATABASE recruit_ai OWNER recruit_ai_user;
GRANT ALL PRIVILEGES ON DATABASE recruit_ai TO recruit_ai_user;
\q
```

### Конфигурация .env:
```env
DATABASE_URL=postgresql://recruit_ai_user:your_password@localhost:5432/recruit_ai
SECRET_KEY=your-super-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-for-ai-features
DEBUG=True
```

## 📋 Что работает в текущей версии

### ✅ Готово:
- [x] Аутентификация и регистрация
- [x] Роли пользователей (кандидат/компания)  
- [x] Загрузка резюме
- [x] Интерфейс процесса интервью
- [x] Работа с камерой и микрофоном
- [x] Dashboard для компаний
- [x] Детальные отчеты с моковыми данными
- [x] Responsive дизайн
- [x] База данных и API структура

### 🚧 В разработке:
- [ ] Интеграция с OpenAI для реального AI-анализа
- [ ] Обработка и транскрибация видео/аудио
- [ ] Реальная проверка CV и сертификатов
- [ ] Email уведомления
- [ ] Создание и управление вакансиями

## 🎨 Особенности интерфейса

### Главная страница:
- Красивый градиентный дизайн
- Выбор роли (кандидат/компания)
- Автоматический редирект для авторизованных пользователей

### Процесс интервью:
- Поэтапный процесс (загрузка CV → проверка оборудования → выбор языка → интервью)
- Работа с веб-камерой и микрофоном
- Темный режим для интервью
- Таймер и прогресс-бар

### Отчеты компании:
- Многоуровневый анализ кандидатов
- Визуализация оценок
- Детальная расшифровка интервью
- Проверка CV и цифрового следа

## 🐛 Известные ограничения

1. **Моковые данные**: AI-анализ пока использует тестовые данные
2. **Локальное хранение**: Файлы сохраняются локально (не в cloud)
3. **Без email**: Уведомления пока не отправляются
4. **Упрощенная база**: Некоторые связи в БД упрощены для демо

## 🔄 Следующие шаги для продакшена

1. **Интеграция OpenAI API** для реального анализа
2. **Настройка cloud storage** (AWS S3, Google Cloud)
3. **Email сервис** для уведомлений
4. **WebSocket** для real-time обновлений
5. **Тестирование** и оптимизация производительности
6. **CI/CD pipeline** для автоматического развертывания

---

**🎉 Recruit.ai готов к демонстрации!** Запускайте и изучайте функционал!




