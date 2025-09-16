#!/bin/bash

# Recruit.ai - Скрипт запуска для разработки

echo "🚀 Запуск Recruit.ai HR Platform..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для проверки установки команды
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 не установлен. Пожалуйста, установите $1${NC}"
        exit 1
    fi
}

# Проверка зависимостей
echo -e "${BLUE}🔍 Проверка зависимостей...${NC}"
check_command python3
check_command node
check_command npm
check_command psql

# Проверка PostgreSQL
echo -e "${BLUE}🗄️  Проверка PostgreSQL...${NC}"
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠️  PostgreSQL не запущен. Запустите PostgreSQL сервер${NC}"
    echo -e "${YELLOW}   Для macOS: brew services start postgresql${NC}"
    echo -e "${YELLOW}   Для Ubuntu: sudo service postgresql start${NC}"
    exit 1
fi

# Создание базы данных если не существует
echo -e "${BLUE}🗄️  Настройка базы данных...${NC}"
if ! psql -lqt | cut -d \| -f 1 | grep -qw recruit_ai; then
    echo -e "${YELLOW}📝 Создание базы данных recruit_ai...${NC}"
    createdb recruit_ai
fi

# Запуск Backend
echo -e "${GREEN}🐍 Запуск Backend (FastAPI)...${NC}"
cd backend

# Создание виртуального окружения если не существует
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Создание виртуального окружения...${NC}"
    python3 -m venv venv
fi

# Активация виртуального окружения
source venv/bin/activate

# Установка зависимостей
echo -e "${YELLOW}📦 Установка Python зависимостей...${NC}"
pip install -r requirements.txt

# Копирование .env файла если не существует
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Создание .env файла...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Не забудьте настроить переменные окружения в .env файле${NC}"
fi

# Запуск backend в фоне
echo -e "${GREEN}🚀 Запуск FastAPI сервера...${NC}"
python main.py &
BACKEND_PID=$!

# Возврат в корневую директорию
cd ..

# Запуск Frontend
echo -e "${GREEN}⚛️  Запуск Frontend (React)...${NC}"

# Установка зависимостей если node_modules не существует
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Установка Node.js зависимостей...${NC}"
    npm install
fi

# Запуск frontend
echo -e "${GREEN}🚀 Запуск React приложения...${NC}"
npm start &
FRONTEND_PID=$!

# Информация о запуске
echo -e "${GREEN}✅ Recruit.ai успешно запущен!${NC}"
echo -e "${BLUE}📡 Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}📊 API Docs: http://localhost:8000/api/docs${NC}"
echo -e "${BLUE}🌐 Frontend: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}📝 Для остановки нажмите Ctrl+C${NC}"

# Функция для корректного завершения
cleanup() {
    echo -e "\n${YELLOW}🛑 Остановка сервисов...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Сервисы остановлены${NC}"
    exit 0
}

# Обработка сигнала прерывания
trap cleanup SIGINT SIGTERM

# Ожидание завершения процессов
wait $BACKEND_PID $FRONTEND_PID




