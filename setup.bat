@echo off
title PyPOS Setup Script
echo ============================================
echo PyPOS - University Stationery System
echo ============================================
echo.

echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python first.
    pause
    exit /b 1
)
echo Python found.

echo.
echo [2/4] Setting up Backend...
cd /d "%~dp0backend"
echo Creating virtual environment...
python -m venv venv
echo Activating virtual environment...
call venv\Scripts\activate
echo Installing dependencies...
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies.
    echo Try running: pip install -r requirements.txt
    pause
    exit /b 1
)
echo Backend setup complete.

echo.
echo [3/4] Setting up Frontend...
cd /d "%~dp0frontend"
echo Installing npm dependencies...
call npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install npm dependencies.
    echo Try running: npm install
    pause
    exit /b 1
)
echo Frontend setup complete.

echo.
echo [4/4] Setup Summary
echo ============================================
echo.
echo Backend:  cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
echo Frontend: cd frontend && npm run dev
echo.
echo Database: Run mysql -u root -p ^< database\schema.sql
echo.
echo Default login: admin / admin123
echo.
echo ============================================
echo.
pause
