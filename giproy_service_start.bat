@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "BACKEND_PORT=3001"
set "FRONTEND_PORT=3010"
set "BACKEND_PYTHON=%PROJECT_DIR%.venv\Scripts\python.exe"
set "NPM_CMD=npm"

if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files\nodejs\npm.cmd" set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"

cd /d "%PROJECT_DIR%backend"
start /b "" "%BACKEND_PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT%

cd /d "%PROJECT_DIR%frontend"
start /b "" "%NPM_CMD%" run preview -- --host 0.0.0.0 --port %FRONTEND_PORT% --strictPort
exit
