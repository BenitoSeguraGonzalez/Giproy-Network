El nombre de archivo, el nombre de directorio o la sintaxis de la etiqueta del volumen no son correctos.
E:\Repositorios\GiProy Networkc@echo off
setlocal
echo ========================================
echo   PARANDO SERVICIOS + RESTART GIPROY ERP
echo ========================================
echo.

:: Kill existing processes
taskkill /f /im uvicorn.exe 2>nul
taskkill /f /im python.exe /fi "WINDOWTITLE eq GIPROY Backend*" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq GIPROY Frontend*" 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq GIPROY Backend*" 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq GIPROY Frontend*" 2>nul
timeout /t 2 /nobreak >nul

set "PROJECT_DIR=%~dp0"
set "BACKEND_PYTHON="
if exist "%PROJECT_DIR%backend\.venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%backend\.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%backend\venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%backend\venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%.venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%venv\Scripts\python.exe"


    pause > nul
    exit /b 1
)

:: Puerto Backend 8000 (standard)
set BACKEND_PORT=8000
:: Puerto Frontend Vite. Cloudflare Tunnel apunta a localhost:3010.
set FRONTEND_PORT=3010

echo [1/2] Iniciando Backend en puerto %BACKEND_PORT%...


timeout /t 5 /nobreak >nul

echo.
echo [2/2] Iniciando Frontend en puerto %FRONTEND_PORT%...
start "GIPROY Frontend" cmd /k "cd /d %~dp0frontend && npx vite --port %FRONTEND_PORT% --host"

echo.
echo ========================================
echo   FULL STACK ACTIVE (FIXED)
echo ========================================
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo Presiona cualquier tecla para salir (services siguen corriendo)...
pause > nul

