@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   INICIANDO GIPROY CONTROL CENTER
echo ========================================
echo.

:: 1. Buscar entorno virtual del proyecto (backend o raiz)
set "PYTHON_EXE="
set "PYTHON_EXE=python"
if exist "backend\.venv\Scripts\python.exe" set "PYTHON_EXE=backend\.venv\Scripts\python.exe"
if exist "backend\venv\Scripts\python.exe" set "PYTHON_EXE=backend\venv\Scripts\python.exe"
if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"
if exist "venv\Scripts\python.exe" set "PYTHON_EXE=venv\Scripts\python.exe"

:: Evita errores de fuentes y codificación
set "QT_LOGGING_RULES=qt.qpa.fonts=false"
set "PYTHONUTF8=1"

:: Verificar dependencias rapidas
"%PYTHON_EXE%" -c "import PySide6, psutil" >nul 2>&1
if errorlevel 1 (
  echo [INFO] Instalando dependencias del Control Center...
  "%PYTHON_EXE%" -m pip install -r "tools\launcher\requirements.txt"
  if errorlevel 1 (
    echo [ERROR] Fallo la instalacion de dependencias requeridas PySide6 psutil
    pause
    exit /b 1
  )
)

:: Lanzar GUI (Usa pythonw para evitar ventana de consola)
set "PYTHONW_EXE=%PYTHON_EXE:python.exe=pythonw.exe%"
if not exist "%PYTHONW_EXE%" set "PYTHONW_EXE=%PYTHON_EXE%"

start "GiProy Control Center" "%PYTHONW_EXE%" "tools\launcher\main.py"

endlocal
exit /b 0
