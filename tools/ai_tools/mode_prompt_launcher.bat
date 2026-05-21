@echo off
setlocal
set SCRIPT_DIR=%~dp0

if "%~1"=="" (
  echo.
  echo ==============================================
  echo  MODE PROMPT LAUNCHER - GIPROY
  echo ==============================================
  echo.
  echo Uso:
  echo   mode_prompt_launcher.bat clasico -o "Objetivo de la sesion"
  echo   mode_prompt_launcher.bat bim -o "Objetivo de la sesion"
  echo   mode_prompt_launcher.bat integracion -o "Objetivo de la sesion"
  echo.
  echo Ejemplos:
  echo   mode_prompt_launcher.bat clasico -o "Revisar modulo de APUs sin tocar BIM"
  echo   mode_prompt_launcher.bat bim -o "Preparar viewer BIM desacoplado"
  echo   mode_prompt_launcher.bat integracion -o "Activar navegacion controlada EDT hacia BIM"
  echo.
  echo Modos disponibles:
  echo   clasico
  echo   bim
  echo   integracion
  echo.
  echo Salida esperada:
  echo   - genera el prompt del modo elegido
  echo   - actualiza docs\runtime\WORK_MODE_STATE.json
  echo   - crea o reutiliza una TASK activa automaticamente
  echo.
  exit /b 0
)

python "%SCRIPT_DIR%mode_prompt_launcher.py" %*
endlocal
