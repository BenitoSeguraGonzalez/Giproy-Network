# BIM-TASK-0168 - Activación gobernada de transición a Operaciones

Fecha: 2026-07-17
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar G05 con una decisión formal que revalide el dossier y baseline de
activos antes de activar la transición al gemelo operativo.

## Alcance ejecutado

- Migración aditiva `de2052a1b2c3` con índice parcial de transición aceptada.
- Revalidación bajo locks del dossier aceptado, inventario y SHA-256.
- Bloqueo ante mutaciones y sustitución auditable de la transición vigente.
- Acciones `Activar` y `Rechazar` en la herramienta `Transición O&M`.

## Validación

- 4 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2052`: correcto.
- Build, 32 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline:
  correctos.

## No interferencia clásica

No se crean órdenes, telemetría, inventario ni escrituras en mantenimiento
clásico. La activación opera únicamente sobre contratos BIM.

## Rollback

Ocultar BIM, retirar la decisión y revertir `de2052a1b2c3`; las transiciones y
sus fuentes permanecen sin el índice de activación vigente.

## Resultado

G05 queda completa. Paridad: 80,83%. Programa: 42/61 slices, 68,85% realizado
y 31,15% pendiente. Sin deploy.
