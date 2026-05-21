@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   DESINSTALAR SERVICIO GIPROY ERP
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

echo [1/3] Deteniendo servicio...
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 2 /nobreak >nul
echo   - Servicio detenido

echo.
echo [2/3] Eliminando servicio...
sc delete "%SERVICE_NAME%" >nul 2>&1
echo   - Servicio eliminado

echo.
echo [3/3] Limpiando archivos temporales...
if exist "%~dp0giproy_service_start.bat" (
    del /f /q "%~dp0giproy_service_start.bat"
    echo   - Archivo temporal eliminado
)

echo.
echo ========================================
echo   SERVICIO DESINSTALADO CORRECTAMENTE
echo ========================================
echo.
pause
