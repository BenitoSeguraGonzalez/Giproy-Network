# Project Bridge Helper ExecPlan

## Objetivo
Permitir que la máquina final detecte Microsoft Project y abra cronogramas `.mpp` desde una sesión interactiva local, sin depender de la automatización COM del backend/servidor.

## Diseño
- `GiProy Project Bridge` local en PowerShell.
- Autoarranque mediante `Scheduled Task` al iniciar sesión.
- API localhost:
  - `GET /health`
  - `GET /status`
  - `POST /open-msproject-from-xml`
- La web exporta XML estable desde backend y se lo entrega al bridge local para que abra Project en la máquina final.

## Componentes
- `tools/project_bridge/bridge_server.ps1`
- `tools/project_bridge/install_bridge.ps1`
- `tools/project_bridge/uninstall_bridge.ps1`
- `backend/app/api/endpoints/project_bridge.py`
- `frontend/src/api/projectBridge.js`
- integración en `frontend/src/components/projects/Cronogramas.jsx`
- integración operativa en `GiProy Control Center`

## Resultado esperado
- instalación única del helper local;
- autoarranque al iniciar sesión de Windows;
- detección local real de Project;
- apertura de cronogramas en Microsoft Project desde el navegador sin usar COM del backend.
