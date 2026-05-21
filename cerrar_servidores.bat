@echo off
echo ========================================
echo   CERRANDO SERVIDORES GIPROY ERP
echo ========================================
echo.


echo [0/4] Deteniendo servicios GIPROY...
sc stop GiProy-Backend 2>nul
sc stop GiProy-Frontend 2>nul
echo.

echo [1/4] Cerrando procesos Python (Backend)...
taskkill /F /IM python.exe 2>nul
if %errorlevel%==0 (
    echo   - Procesos Python terminados
) else (
    echo   - No habia procesos Python activos
)

echo.
echo [2/4] Cerrando procesos Node.js (Frontend)...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo   - Procesos Node.js terminados
) else (
    echo   - No habia procesos Node.js activos
)

echo.
echo [3/4] Liberando puertos del sistema...

:: Buscar y matar procesos en puertos comunes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo   - Liberando puerto 3000 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    echo   - Liberando puerto 3001 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8010"') do (
    echo   - Liberando puerto 8010 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

echo.
echo [4/4] Verificando estado de puertos...
netstat -ano | findstr ":3000 :3001 :8010 :5174" > nul
if %errorlevel%==0 (
    echo   ADVERTENCIA: Algunos puertos pueden estar en uso
) else (
    echo   - Todos los puertos liberados (3000, 3001, 8010)
)

echo.
echo ========================================
echo   SERVIDORES CERRADOS CORRECTAMENTE
echo ========================================
echo.
pause
