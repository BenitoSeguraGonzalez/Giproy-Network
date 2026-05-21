@echo off
setlocal
cd /d "%~dp0..\..\.."

if not exist ".venv\Scripts\python.exe" (
  echo [ERROR] No existe .venv\Scripts\python.exe
  exit /b 1
)

set "QT_LOGGING_RULES=qt.qpa.fonts=false"
set "PYTHONUTF8=1"

REM Validar dependencias sin ejecutar pip en cada inicio.
".venv\Scripts\python.exe" -c "import PySide6, psutil" >nul 2>&1
if errorlevel 1 (
  echo [INFO] Instalando dependencias del launcher...
  ".venv\Scripts\python.exe" -m pip install -r "tools\launcher\requirements.txt"
  if errorlevel 1 (
    echo [ERROR] No se pudieron instalar dependencias del launcher.
    exit /b 1
  )
)

".venv\Scripts\python.exe" "tools\launcher\main.py"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
  echo [ERROR] Launcher finalizo con codigo %EC%.
  if exist ".runtime\logs\launcher.log" (
    echo [INFO] Ultimas lineas de .runtime\logs\launcher.log
    powershell -NoProfile -Command "Get-Content '.runtime\logs\launcher.log' -Tail 80"
  )
  exit /b %EC%
)
endlocal
