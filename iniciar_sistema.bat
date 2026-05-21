@echo off
setlocal
echo ========================================
echo   INICIANDO SERVIDORES GIPROY ERP
echo ========================================
echo.

:: Puerto Backend usado por GiProy Control Center
set BACKEND_PORT=3001
:: Puerto Frontend Vite. Cloudflare Tunnel apunta a localhost:3010.
set FRONTEND_PORT=3010

set "PROJECT_DIR=%~dp0"
set "BACKEND_PYTHON="
set "NPM_CMD="
if exist "%PROJECT_DIR%backend\.venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%backend\.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%backend\venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%backend\venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%.venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%venv\Scripts\python.exe"
where npm >nul 2>nul && set "NPM_CMD=npm"
if not defined NPM_CMD if exist "C:\Program Files\nodejs\npm.cmd" set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"

if not defined BACKEND_PYTHON (
    echo ERROR: No se encontro el entorno virtual Python del backend.
    pause > nul
    exit /b 1
)
if not defined NPM_CMD (
    echo ERROR: No se encontro npm. Instala Node.js LTS o reinicia la terminal para refrescar PATH.
    pause > nul
    exit /b 1
)

echo [1/2] Iniciando Backend en puerto %BACKEND_PORT%...
start "GIPROY Backend" cmd /k "cd /d %~dp0backend && \"%BACKEND_PYTHON%\" -m uvicorn app.main:app --reload --host 0.0.0.0 --port %BACKEND_PORT%"

echo.
echo [2/2] Iniciando Frontend en puerto %FRONTEND_PORT%...
start "GIPROY Frontend" cmd /k "cd /d %~dp0frontend && \"%NPM_CMD%\" run dev -- --port %FRONTEND_PORT% --host"

echo.
echo ========================================
echo   SERVIDORES INICIADOS
echo ========================================
echo.
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo Presiona cualquier tecla para salir...
pause > nul
