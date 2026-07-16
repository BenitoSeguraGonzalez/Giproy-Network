# BIM-TASK-0150 - Inspecciones, checklists y punch lists de Campo

Estado: Cerrada localmente

## Objetivo

Completar el workflow general de inspeccion de Campo sobre riesgos 4D
existentes, con checklist estructurado y hallazgos correctivos gobernados, sin
crear dependencias desde GiProy Clasico.

## Cambios

- Migracion aditiva `de2034a1b2c3` con `checklist_json` en inspecciones y tabla
  tenant-aware `bim_4d_safety_punch_items`.
- Listado historico de inspecciones por riesgo y validacion coherente entre
  resultado y checks conformes/no conformes.
- Punch items ligados a inspeccion no conforme, con prioridad y ciclo
  `open`, `in_progress`, `closed`, incluido cierre y reapertura auditables.
- La antigua tab `Riesgos` se sustituye por `Inspecciones`; conserva riesgo,
  zona WebGL y exposicion 4D dentro del nuevo flujo unico.
- Harness y smoke interactivo en `1920x900` y `2560x1300`.

## Criterios verificados

- Riesgo, inspeccion y punch item se resuelven siempre por empresa y proyecto.
- Una inspeccion conforme no admite checks fallidos; una no conforme exige al
  menos uno.
- Una inspeccion conforme no puede originar punch items.
- Cada hallazgo conserva inspeccion, riesgo, prioridad, estado, creador y
  cierre.
- No se agrega PWA, cache, sincronizacion offline ni soporte movil.

## Validacion

- Compilacion Python y build Vite: OK.
- Regresion PostgreSQL de seguridad, partes e incidencias: `10 passed`.
- Alembic PostgreSQL `de2010 -> de2034 -> de2010 -> de2034`: OK;
  `JSON/TIMESTAMPTZ` verificados.
- 17 smokes Workspace BIM V2 encadenados: OK.
- Playwright `1920x900` y `2560x1300`: OK; canvas visible, sin overflow,
  solapamientos ni errores de consola.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: D07 completa, `61,67%`.

## Rollback

Retirar endpoints, servicio, schemas, cliente, UX, harness y smoke; ejecutar
downgrade `de2034a1b2c3 -> de2033a1b2c3`. La tabla de punch items y el JSON de
checklist se eliminan sin tocar riesgos previos, GiProy Clasico ni TASK-1807.
