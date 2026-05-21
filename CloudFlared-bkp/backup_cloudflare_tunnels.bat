@echo off
setlocal EnableDelayedExpansion

set BACKUP_DIR=D:\CloudFlared-bkp
set CLOUDFLARE_DIR=%USERPROFILE%\.cloudflared

echo.
echo ========================================
echo BACKUP CLOUDFLARE TUNNELS
echo ========================================
echo.

mkdir "%BACKUP_DIR%" >nul 2>&1
mkdir "%BACKUP_DIR%\.cloudflared" >nul 2>&1

if not exist "%CLOUDFLARE_DIR%" (
    echo ERROR: No existe %CLOUDFLARE_DIR%
    pause
    exit /b 1
)

echo Copiando .cloudflared...
xcopy "%CLOUDFLARE_DIR%\*" "%BACKUP_DIR%\.cloudflared\" /E /I /Y

echo.
echo Exportando lista de tuneles...
cloudflared tunnel list > "%BACKUP_DIR%\tunnels-list.txt"

echo.
echo Buscando tuneles automaticamente...

for /f "skip=2 tokens=1,2" %%a in ('cloudflared tunnel list') do (
    set TUNNEL_ID=%%a
    set TUNNEL_NAME=%%b

    if not "!TUNNEL_NAME!"=="" (
        echo Exportando token de !TUNNEL_NAME!
        cloudflared tunnel token !TUNNEL_NAME! > "%BACKUP_DIR%\!TUNNEL_NAME!-token.txt"
    )
)

echo.
echo Exportando servicios NSSM...
nssm dump cloudflared-eXcom > "%BACKUP_DIR%\cloudflared-eXcom-nssm.txt" 2>nul
nssm dump cloudflared-SaaS > "%BACKUP_DIR%\cloudflared-SaaS-nssm.txt" 2>nul

echo.
echo Creando ZIP...
powershell -Command "Compress-Archive -Path 'D:\CloudFlared-bkp\*' -DestinationPath 'D:\CloudFlared-bkp.zip' -Force"

echo.
echo ========================================
echo BACKUP COMPLETADO
echo ========================================
echo.
echo Carpeta: D:\CloudFlared-bkp
echo ZIP: D:\CloudFlared-bkp.zip
echo.

pause
