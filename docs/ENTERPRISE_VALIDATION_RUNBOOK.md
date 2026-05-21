# Runbook de validacion enterprise - GiProy Clasico

Fecha: 2026-05-21  
Modo: GIPROY CLASICO  
Alcance: validacion local conservadora sin deploy, sin migraciones destructivas y sin activar UX BIM

## Objetivo

Centralizar los comandos de validacion usados por Codex/OpenCode para cerrar slices incrementales sin depender de memoria de sesion ni reanalisis completo del repositorio.

## Gate base recomendado

```powershell
.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend
```

Cubre:

- JSON documentales: `docs/project_state.json`, `docs/runtime/WORK_MODE_STATE.json`, `docs/repo_hygiene_inventory.json`, `docs/logging_inventory.json`.
- `compileall` de `backend/app`.
- Import de `app.main`.
- `npm run build`.
- Smoke clasico anti-BIM.

## Cambios Python focales

```powershell
.\.venv\Scripts\python.exe -m py_compile ruta\al\archivo.py
```

Usar siempre que se toque backend, tooling Python o scripts de validacion.

## Cambios documentales JSON

```powershell
.\.venv\Scripts\python.exe -c "import json; json.load(open('docs/project_state.json', encoding='utf-8')); json.load(open('docs/runtime/WORK_MODE_STATE.json', encoding='utf-8')); print('json_ok')"
```

Agregar archivos al comando cuando el slice cree o modifique snapshots JSON.

## Inventario de higiene

```powershell
.\.venv\Scripts\python.exe tools\ai_tools\repo_hygiene_inventory.py
```

Solo regenerar `docs/repo_hygiene_inventory.json` si el slice trata higiene de repositorio o cambia patrones de clasificacion.

## Inventario de logging

```powershell
.\.venv\Scripts\python.exe tools\ai_tools\logging_inventory.py
```

Solo regenerar `docs/logging_inventory.json` si el slice trata logging, consola, prints o politica de datos sensibles.

## Frontend clasico

```powershell
npm run build
```

Desde `frontend/`. Debe complementarse con:

```powershell
node scripts/smoke-classic-no-bim-contamination.mjs
```

El smoke anti-BIM es obligatorio si se toca frontend, rutas, componentes compartidos o estilos visibles.

## Criterios de no cierre

No cerrar una sesion como correcta si:

- Falla el baseline enterprise.
- Falla el smoke anti-BIM tras tocar frontend.
- Se introduce dependencia desde capa clasica hacia BIM.
- Se activa UX BIM en MODO 1.
- Se modifican DB, auth, tenant, licencias, sesiones, presupuestos, EDT o cronogramas sin validacion focal.
- Quedan cambios no documentados en TASK y CHANGELOG.

## Warnings conocidos no bloqueantes

- Pydantic puede advertir por campos BIM `model_name` y `model_id` con namespace `model_`. En MODO 1 se documenta, no se corrige.
- Vite puede advertir chunks mayores a 500 kB (`CronogramaGantt`, `index`). Es deuda controlada, no fallo de build.

## Rollback

El rollback debe ser por slice:

- Revertir archivos tocados por la TASK.
- No usar `git reset --hard`.
- No borrar artefactos o codigo aparentemente muerto sin busqueda de referencias.
- No revertir cambios ajenos del worktree.
