# BIM-TASK-0166 - Aceptación gobernada del dossier digital

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar G04 con una decisión formal que revalide el manifiesto digital contra
sus fuentes gobernadas y conserve una única entrega aceptada vigente.

## Alcance ejecutado

- Migración aditiva `de2050a1b2c3` con índice parcial de dossier aceptado.
- Revalidación bajo locks de as-built, punch, sistemas, activos y revisiones
  CDE antes de aceptar o rechazar.
- Bloqueo ante cualquier cambio del manifiesto y sustitución auditable de una
  aceptación previa mediante estado `superseded`.
- Decisión de dossier integrada en la herramienta de Entrega existente.

## Validación

- 5 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2050`: correcto.
- Build, 31 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline:
  correctos.

## No interferencia clásica

No se modifican documentos, Proyectos, Cronogramas ni contratos clásicos. La
decisión opera solo sobre el dossier y las fuentes BIM gobernadas.

## Rollback

Ocultar BIM, retirar la acción de decisión y revertir `de2050a1b2c3`; los
dossiers y sus fuentes permanecen disponibles sin el índice de aceptación.

## Resultado

G04 queda completa. Paridad: 79,17%. Programa: 40/61 slices, 65,57% realizado
y 34,43% pendiente. Sin deploy.
