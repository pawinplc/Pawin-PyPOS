@echo off
title PyPOS Backend Setup
echo ============================================
echo PyPOS Backend Setup
echo ============================================
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    echo Alternatively, you can download it from Microsoft Store:
    echo winget install Python.3.11
    echo.
    pause
    exit /b 1
)

echo [1/4] Python found: 
python --version
echo.

echo [2/4] Creating virtual environment...
if exist "venv" (
    echo Virtual environment already exists
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)
echo.

echo [3/4] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    echo.
    echo Trying to create fresh virtual environment...
    rmdir /s /q venv 2>nul
    python -m venv venv
    call venv\Scripts\activate.bat
)
echo.

echo Installing requirements...
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running manually:
    echo   pip install fastapi uvicorn sqlalchemy pymysql cryptography python-jose passlib python-multipart pydantic pydantic-settings reportlab openpyxl
    pause
    exit /b 1
)
echo.

echo [4/4] Setup complete!
echo.
echo ============================================
echo To start the backend server:
echo.
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo API Documentation: http://localhost:8000/docs
echo ============================================
echo.
pause
