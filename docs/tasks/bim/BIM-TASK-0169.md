# BIM-TASK-0169 - Matriz operacional de alertas BIM

Fecha: 2026-07-17
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar H04 con alertas y escalamiento in-app para RFI, submittals y
revisiones CDE, sin depender de notificaciones clásicas.

## Alcance ejecutado

- Migración aditiva `de2053a1b2c3` para alertas tenant-aware y deduplicadas.
- Reconciliación idempotente con niveles próximo, vencido y escalado.
- Resolución automática cuando la fuente deja de estar activa o cambia.
- Acuse restringido al destinatario y matriz compacta dentro de Resumen CDE.

## Validación

- 6 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2053`: correcto.
- Playwright en 1920x900 y 2560x1300, build, 32 smokes BIM, anti-BIM y
  baseline enterprise: correctos.

## No interferencia clásica

No se modifican tablas, endpoints, jobs ni canales de notificación clásicos.
La matriz consulta y escribe exclusivamente contratos BIM.

## Rollback

Ocultar BIM, retirar los tres endpoints y revertir `de2053a1b2c3`. RFI,
submittals y revisiones CDE permanecen intactos.

## Resultado

H04 queda completa. Paridad: 81,67%. Programa: 43/61 slices, 70,49% realizado
y 29,51% pendiente. Sin deploy.
