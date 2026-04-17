@echo off
setlocal

if "%~1"=="" (
  echo Usage: print_reset_link.bat user@example.com
  exit /b 1
)

set "REPO_DIR=%~dp0"
set "BACKEND_DIR=%REPO_DIR%backend"
set "PYTHON_EXE=%REPO_DIR%.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"
)

if not exist "%PYTHON_EXE%" (
  echo Python executable not found. Expected one of:
  echo   %REPO_DIR%.venv\Scripts\python.exe
  echo   %BACKEND_DIR%\.venv\Scripts\python.exe
  exit /b 1
)

cd /d "%BACKEND_DIR%"
"%PYTHON_EXE%" manage.py print_reset_link "%~1"
