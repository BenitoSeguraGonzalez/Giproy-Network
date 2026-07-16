# BIM-TASK-0026: guarda UX de validacion previa a importacion BIM

## Estado
Cerrada

## Objetivo

Alinear la UX BIM con la importacion transaccional del backend para evitar que
un usuario dispare importaciones JSON BIM con errores bloqueantes sin validar.

## Alcance

- Validar paquetes JSON BIM antes de `json-package`.
- Validar lotes JSON BIM antes de `json-batch`.
- Bloquear la importacion cuando la validacion reporta errores.
- Permitir importacion cuando solo existen advertencias.
- Mantener la validacion dentro de `BimWorkspace`, sin tocar `Proyectos.jsx`.

## Resultado

- `frontend/src/components/bim/BimWorkspace.jsx` agrega
  `validatePayloadsBeforeImport(...)`.
- El workspace BIM consulta `bimModelsApi.validateJsonBatch(...)` antes de
  importar paquete unico o batch.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` ahora bloquea regresiones
  si se quita la validacion previa.

## No interferencia

- Sin cambios en `frontend/src/pages/Proyectos.jsx`.
- Sin activar `BimTab`.
- Sin cambios backend, DB real, migraciones, auth/JWT/tenant, EDT/APUs/
  Presupuesto, Cronogramas, Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK.

Warning conocido no bloqueante: chunks grandes Vite.

## Pendiente posterior

- Mejorar microcopy visual de advertencias/errores cuando el flujo BIM salga de
  incubacion.
- Mantener importacion IFC/3D madura como slice separado.
