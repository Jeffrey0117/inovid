@echo off
REM Windows 啟動腳本

echo 🚀 Starting Inovid Scene Blueprint Engine...
echo.

REM 檢查 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+
    exit /b 1
)

REM 檢查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

echo ✅ All dependencies checked
echo.

REM 啟動 Python 服務
echo 🐍 Starting Python microservice...
start "Python Service" cmd /k "cd python-service && python app.py"

REM 等待 3 秒
timeout /t 3 /nobreak >nul

REM 啟動 Node.js 服務
echo 🟢 Starting Node.js main service...
start "Node.js Service" cmd /k "npm run dev"

echo.
echo ✨ Services started!
echo    Python service: http://localhost:5000
echo    Node.js service: http://localhost:3000
echo.
echo Close the terminal windows to stop services
