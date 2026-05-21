# Cronograma Trabajo MS Project Python Environment Alignment

## Objetivo
Eliminar la causa raíz del mensaje `No se detectó pywin32/win32com...` alineando los scripts de arranque del backend con la `.venv` real del proyecto.

## Alcance
- Revisar cómo se levanta el backend en scripts operativos.
- Sustituir invocaciones `uvicorn` globales por `python -m uvicorn` usando la `.venv` del proyecto.
- Cubrir backend manual, arranque combinado y servicio Windows.

## Resultado
- `backend/activaSistema.bat` ya usa el `python.exe` de la `.venv`.
- `iniciar_sistema.bat` ya arranca el backend con la `.venv` correcta.
- `instalar_servicio.bat` genera el servicio Windows usando el `python.exe` de la `.venv` en lugar del `uvicorn` global.
