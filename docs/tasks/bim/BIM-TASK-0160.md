# BIM-TASK-0160 - Forecast de coste final BIM

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F07 con forecast de coste final versionado y aprobable, aislado de
Presupuestos y contabilidad clasicos.

## Alcance ejecutado

- Migracion aditiva `de2044a1b2c3` para `bim_cost_forecasts`.
- Snapshot por moneda de estimacion aprobada, contratos activos/completados,
  ledger real, ETC, EAC y variacion final.
- Workflow borrador/aprobado/rechazado/sustituido y una aprobacion vigente por
  proyecto y moneda.
- Herramienta `Forecast` en Produccion BIM V2 y endpoints protegidos.

## Validacion

- 2 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2044`: correcto.
- Build, Playwright 1920x900/2560x1300, 27 smokes y baseline: correctos.

## Rollback

Ocultar BIM, retirar `Forecast` y revertir `de2044a1b2c3`; no se afectan tablas
clasicas ni los dominios BIM fuente.

## Resultado

F07 completa. Paridad: 74,17%. Programa: 34/61 slices, 55,74% realizado y
44,26% pendiente. Sin deploy.
