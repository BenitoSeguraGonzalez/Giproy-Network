# Baseline de Validacion Tecnica - GiProy Network

Fecha: 2026-05-21  
Modo: GIPROY CLASICO  
Alcance: validacion base previa a refactor de codigo

## Objetivo

Confirmar que la base actual puede compilar e importar antes de iniciar ajustes de codigo productivo, modularizacion o movimiento de archivos.

## Resultado

La validacion base queda apta para iniciar micro-slices conservadores.

## Validaciones ejecutadas

### Backend

- `compileall` sobre `backend/app`: OK.
- Import de `app.main` con `PYTHONPATH=backend`: OK.

Observacion:

- El import emite warnings no bloqueantes de Pydantic para campos `model_name` y `model_id` por namespace protegido `model_`.
- No se corrige en esta fase porque no rompe startup y requiere revisar el contrato de schemas/modelos afectados.

### Frontend

- `npm run build` desde `frontend`: OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Observacion:

- Vite mantiene warnings de chunks mayores a 500 kB (`CronogramaGantt` e `index`). No bloquean build.
- El code splitting queda como deuda controlada para fase posterior, no como refactor inmediato.

### Documentacion y snapshots

- Parse JSON de `docs/project_state.json`: OK.
- Parse JSON de `docs/runtime/WORK_MODE_STATE.json`: OK.
- Parse JSON de `docs/repo_hygiene_inventory.json`: OK.

## Impacto sobre GiProy Clasico

Sin cambios funcionales. La validacion confirma que el flujo clasico puede seguir hacia ajustes incrementales con gates activos.

## No interferencia BIM

Smoke anti-contaminacion BIM OK. No se modifican rutas BIM, UX BIM, feature flags BIM ni acoplamientos desde la capa clasica.

## Siguiente fase autorizable

Iniciar Fase 4 con micro-slices backend de bajo riesgo:

1. helpers puros sin DB
2. validaciones/imports sin cambio de contrato
3. documentacion de deudas antes de mover codigo

No iniciar todavia:

- movimiento masivo de servicios
- cambios DB
- cambios de rutas
- refactor de auth/tenant
- refactor de Presupuesto/APU/Cronogramas

## Deuda observada tras primeros micro-slices

- `backend/app` queda sin `print()` diagnosticos en endpoints clasicos tocados durante TASK-1705/TASK-1706.
- Se conservan `print()` deliberados en mock de email, seed de licencias y fallbacks de escritura de trazas/logs.
- Los warnings Pydantic por `model_name`/`model_id` pertenecen a schemas BIM; no se corrigen en modo clasico para evitar interferencia con BIM.
- Los warnings Vite de chunks grandes siguen como deuda controlada; requieren una fase frontend especifica, no un ajuste colateral.
