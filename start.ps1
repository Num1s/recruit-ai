# Recruit.ai - PowerShell скрипт запуска для Windows

Write-Host "🚀 Запуск Recruit.ai HR Platform..." -ForegroundColor Green

# Функция для проверки установки команды
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        Write-Host "❌ $Command не установлен. Пожалуйста, установите $Command" -ForegroundColor Red
        return $false
    }
}

# Проверка зависимостей
Write-Host "🔍 Проверка зависимостей..." -ForegroundColor Blue

$dependencies = @("python", "node", "npm")
$allInstalled = $true

foreach ($dep in $dependencies) {
    if (-not (Test-Command $dep)) {
        $allInstalled = $false
    }
}

if (-not $allInstalled) {
    Write-Host "Установите недостающие зависимости и запустите скрипт снова." -ForegroundColor Yellow
    exit 1
}

# Запуск Backend
Write-Host "🐍 Настройка Backend (FastAPI)..." -ForegroundColor Green
Set-Location backend

# Создание виртуального окружения если не существует
if (-not (Test-Path "venv")) {
    Write-Host "📦 Создание виртуального окружения..." -ForegroundColor Yellow
    python -m venv venv
}

# Активация виртуального окружения
Write-Host "🔧 Активация виртуального окружения..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Установка зависимостей
Write-Host "📦 Установка Python зависимостей..." -ForegroundColor Yellow
pip install -r requirements.txt

# Копирование .env файла если не существует
if (-not (Test-Path ".env")) {
    Write-Host "⚙️ Создание .env файла..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️ Не забудьте настроить переменные окружения в .env файле" -ForegroundColor Yellow
}

# Запуск backend в фоне
Write-Host "🚀 Запуск FastAPI сервера..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "main.py" -WindowStyle Hidden

# Возврат в корневую директорию
Set-Location ..

# Запуск Frontend
Write-Host "⚛️ Настройка Frontend (React)..." -ForegroundColor Green

# Установка зависимостей если node_modules не существует
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка Node.js зависимостей..." -ForegroundColor Yellow
    npm install
}

# Информация о запуске
Write-Host ""
Write-Host "✅ Recruit.ai настроен и готов к запуску!" -ForegroundColor Green
Write-Host "📡 Backend API будет доступен: http://localhost:8000" -ForegroundColor Blue
Write-Host "📊 API Docs будет доступно: http://localhost:8000/api/docs" -ForegroundColor Blue
Write-Host "🌐 Frontend будет доступен: http://localhost:3000" -ForegroundColor Blue
Write-Host ""
Write-Host "🚀 Запуск React приложения..." -ForegroundColor Green
Write-Host "📝 Для остановки нажмите Ctrl+C в окне терминала" -ForegroundColor Yellow

# Запуск frontend (это будет основной процесс)
npm start
