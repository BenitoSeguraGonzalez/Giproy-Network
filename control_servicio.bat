@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   CONTROL SERVICIO GIPROY ERP
echo ========================================
echo.

set "SERVICE_NAME=GIPROY_ERP"

if "%~1"=="" goto menu
if /i "%~1"=="start" goto start
if /i "%~1"=="stop" goto stop
if /i "%~1"=="restart" goto restart
if /i "%~1"=="status" goto status
goto menu

:menu
echo Uso: control_servicio.bat [comando]
echo.
echo Comandos disponibles:
echo   start    - Iniciar el servicio
echo   stop     - Detener el servicio
echo   restart  - Reiniciar el servicio
echo   status   - Ver estado del servicio
echo.
echo Ejemplo:
echo   control_servicio.bat start
pause
exit /b 0

:start
echo Iniciando servicio %SERVICE_NAME%...
sc start "%SERVICE_NAME%"
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo   SERVICIO INICIADO
    echo ========================================
    echo.
    echo Backend:  http://localhost:3000
    echo Frontend: http://localhost:3001
) else (
    echo ERROR: No se pudo iniciar el servicio
    echo Asegurese de que el servicio este instalado
)
pause
exit /b 0

:stop
echo Deteniendo servicio %SERVICE_NAME%...
sc stop "%SERVICE_NAME%"
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo   SERVICIO DETENIDO
    echo ========================================
) else (
    echo ERROR: No se pudo detener el servicio
)
pause
exit /b 0

:restart
echo Reiniciando servicio %SERVICE_NAME%...
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 /nobreak >nul
sc start "%SERVICE_NAME%"
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo   SERVICIO REINICIADO
    echo ========================================
    echo.
    echo Backend:  http://localhost:3000
    echo Frontend: http://localhost:3001
) else (
    echo ERROR: No se pudo reiniciar el servicio
)
pause
exit /b 0

:status
echo Estado del servicio %SERVICE_NAME%:
echo.
sc query "%SERVICE_NAME%"
echo.
pause
exit /b 0
