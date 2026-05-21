@echo off
setlocal

set "BACKEND_DIR=%~dp0"
set "PYTHON_EXE="

if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" set "PYTHON_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "%BACKEND_DIR%\venv\Scripts\python.exe" set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "%BACKEND_DIR%\..\.venv\Scripts\python.exe" set "PYTHON_EXE=%BACKEND_DIR%\..\.venv\Scripts\python.exe"
if not defined PYTHON_EXE if exist "%BACKEND_DIR%\..\venv\Scripts\python.exe" set "PYTHON_EXE=%BACKEND_DIR%\..\venv\Scripts\python.exe"

if not defined PYTHON_EXE (
    echo ERROR: No se encontro un python.exe de entorno virtual para el backend.
    echo Buscado en:
    echo   %BACKEND_DIR%\.venv\Scripts\python.exe
    echo   %BACKEND_DIR%\venv\Scripts\python.exe
    echo   %BACKEND_DIR%\..\.venv\Scripts\python.exe
    echo   %BACKEND_DIR%\..\venv\Scripts\python.exe
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"
"%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8500 --reload
