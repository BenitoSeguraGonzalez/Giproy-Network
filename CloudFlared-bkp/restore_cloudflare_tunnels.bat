@echo off
setlocal EnableDelayedExpansion

set BACKUP_DIR=D:\CloudFlared-bkp
set CLOUDFLARE_DIR=%USERPROFILE%\.cloudflared

echo.
echo ========================================
echo RESTORE CLOUDFLARE TUNNELS
echo ========================================
echo.

mkdir "%CLOUDFLARE_DIR%" >nul 2>&1

echo Restaurando .cloudflared...
xcopy "%BACKUP_DIR%\.cloudflared\*" "%CLOUDFLARE_DIR%\" /E /I /Y

echo.
echo Verificando cloudflared...
cloudflared version

echo.
echo Verificando NSSM...
nssm >nul 2>&1

if errorlevel 1 (
    echo ERROR: NSSM no instalado
    echo Instalar con:
    echo winget install NSSM.NSSM --source winget
    pause
    exit /b 1
)

echo.
echo Eliminando servicios antiguos...
for /f "tokens=*" %%s in ('sc query state^= all ^| findstr /I "cloudflared-"') do (
    rem Ignorado
)

nssm remove cloudflared-eXcom confirm >nul 2>&1
nssm remove cloudflared-SaaS confirm >nul 2>&1

echo.
echo Creando servicios automaticamente...

for %%f in ("%BACKUP_DIR%\*-token.txt") do (

    set FILE=%%~nf
    set SERVICE=!FILE:-token=!

    for /f "delims=" %%t in (%%f) do (
        set TOKEN=%%t
    )

    echo Creando servicio: !SERVICE!

    nssm install !SERVICE!
    nssm set !SERVICE! Application "C:\Users\%USERNAME%\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
    nssm set !SERVICE! AppDirectory "C:\Users\%USERNAME%"
    nssm set !SERVICE! AppParameters "tunnel run --token !TOKEN!"
    nssm set !SERVICE! Start SERVICE_AUTO_START

    powershell -Command "Start-Service '!SERVICE!'"

)

echo.
echo ========================================
echo RESTAURACION COMPLETADA
echo ========================================
echo.

cloudflared tunnel list

echo.
echo Servicios:
powershell -Command "Get-Service *cloud*"

echo.
pause
