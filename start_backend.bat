@echo off
setlocal

REM Resolve repo root from this script location.
set "REPO_DIR=%~dp0"
set "BACKEND_DIR=%REPO_DIR%backend"
set "PYTHON_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
	echo Backend virtual environment not found at:
	echo %PYTHON_EXE%
	echo.
	echo Run these commands first:
	echo   cd backend
	echo   python -m venv .venv
	echo   .venv\Scripts\python.exe -m pip install -r requirements.txt
	pause
	exit /b 1
)

cd /d "%BACKEND_DIR%"
"%PYTHON_EXE%" manage.py runserver 0.0.0.0:8000
pause
