@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   INSTALAR SERVICIO GIPROY ERP
echo ========================================
echo.

:: Verificar si es Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Este script requiere permisos de Administrador
    echo Haga clic derecho en este archivo y seleccione "Ejecutar como administrador"
    pause
    exit /b 1
)

set "SERVICE_NAME=GIPROY_ERP"
set "DISPLAY_NAME=GIPROY ERP System"
set "DESCRIPTION=Sistema ERP GIPROY - Backend y Frontend"

:: Rutas absolutas
set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "BACKEND_PYTHON="

if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" set "BACKEND_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%BACKEND_DIR%\venv\Scripts\python.exe" set "BACKEND_PYTHON=%BACKEND_DIR%\venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%.venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%.venv\Scripts\python.exe"
if not defined BACKEND_PYTHON if exist "%PROJECT_DIR%venv\Scripts\python.exe" set "BACKEND_PYTHON=%PROJECT_DIR%venv\Scripts\python.exe"

echo [1/4] Verificando directorios...
if not exist "%BACKEND_DIR%" (
    echo ERROR: No se encontro el directorio backend
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%" (
    echo ERROR: No se encontro el directorio frontend
    pause
    exit /b 1
)
if not defined BACKEND_PYTHON (
    echo ERROR: No se encontro un python.exe de entorno virtual para el backend
    pause
    exit /b 1
)
echo   - Directorios verificados

echo.
echo [2/4] Deteniendo servicio existente si existe...
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 /nobreak >nul
sc delete "%SERVICE_NAME%" >nul 2>&1
echo   - Servicio anterior eliminado

echo.
echo [3/4] Creando script de inicio del servicio...
:: Crear script que inicia ambos servicios
echo @echo off > "%PROJECT_DIR%giproy_service_start.bat"
echo cd /d "%BACKEND_DIR%" >> "%PROJECT_DIR%giproy_service_start.bat"
echo start /b "" "%BACKEND_PYTHON%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3000 >> "%PROJECT_DIR%giproy_service_start.bat"
echo cd /d "%FRONTEND_DIR%" >> "%PROJECT_DIR%giproy_service_start.bat"
echo start /b npm run dev >> "%PROJECT_DIR%giproy_service_start.bat"
echo exit >> "%PROJECT_DIR%giproy_service_start.bat"

echo.
echo [4/4] Instalando servicio de Windows...
:: Crear el servicio usando sc.exe
sc create "%SERVICE_NAME%" binPath= "cmd /c \"%PROJECT_DIR%giproy_service_start.bat\"" start= auto DisplayName= "%DISPLAY_NAME%" >nul

if %errorlevel% neq 0 (
    echo ERROR: No se pudo crear el servicio
    pause
    exit /b 1
)

:: Configurar descripción
sc description "%SERVICE_NAME%" "%DESCRIPTION%" >nul

:: Configurar reinicio automático
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/60000/restart/60000/restart/60000 >nul

echo.
echo ========================================
echo   SERVICIO INSTALADO CORRECTAMENTE
echo ========================================
echo.
echo Servicio: %SERVICE_NAME%
echo Display:   %DISPLAY_NAME%
echo Puertos:   Backend:3000, Frontend:3001
echo.
echo Para iniciar el servicio, ejecute:
echo   sc start %SERVICE_NAME%
echo.
echo O use el siguiente comando:
echo.
pause

:: Preguntar si iniciar el servicio
echo.
set /p INICIAR="Desea iniciar el servicio ahora? (S/N): "
if /i "%INICIAR%"=="S" (
    echo.
    echo Iniciando servicio...
    sc start "%SERVICE_NAME%"
    echo.
    echo ========================================
    echo   SERVICIO INICIADO
    echo ========================================
    echo.
    echo Backend:  http://localhost:3000
    echo Frontend: http://localhost:3001
)
