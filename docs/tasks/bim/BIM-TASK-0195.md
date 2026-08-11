# BIM-TASK-0195 - Modal de dossier por encima del workspace

Fecha: 2026-08-11

Estado: CERRADA Y DESPLEGADA EN BETA

Relacionado: TASK-2048

## Solución y evidencia

- El diálogo se renderiza mediante portal en `document.body` con overlay fijo.
- Conserva Escape, trampa de foco y retorno a `Nuevo dossier`.
- Playwright verifica hit-testing, cierre y foco a 1920x1080.
- Contrato `BimFlowWorkspace`, harness DOM y build Vite correctos.
- Beta frontend `28205aecdff7...` y stack completo saludables.

## Rollback

Revertir el portal y la regresión. No existen migraciones ni cambios de datos.
