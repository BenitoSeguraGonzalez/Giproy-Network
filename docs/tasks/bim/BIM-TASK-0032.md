# BIM-TASK-0032: cliente frontend BIM para manifiesto IFC

## Estado
Cerrada

## Objetivo

Completar el contrato frontend de dominio para el endpoint de manifiesto IFC
agregado en `BIM-TASK-0031`, sin exponer UX nueva ni activar BIM en GiProy
Clasico.

## Alcance

- Agregar metodo de cliente en `frontend/src/api/bimModels.js`.
- Mantener las llamadas BIM dentro de `frontend/src/api`.
- Cubrir el contrato con smoke frontend BIM positivo.
- No montar botones, rutas ni pantallas visibles nuevas.

## Resultado

- `bimModelsApi.registerIfcManifest(projectId, payload, empresaId)` llama a
  `/bim/projects/{projectId}/imports/ifc-manifest` usando `withTenantConfig`.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` verifica que el cliente BIM
  de dominio expone el contrato IFC manifest.
- No se toca `Proyectos.jsx` ni se activa `BimTab`.

## No interferencia

- Sin cambios backend productivos en este slice.
- Sin cambios en GiProy Clasico, Proyectos, EDT, APUs, Presupuesto,
  Cronogramas, auth/JWT/tenant compartido, DB real, migraciones,
  Docker/Coolify, CI/CD, staging ni produccion.
- La experiencia clasica con BIM apagado queda validada por smoke anti-BIM.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK, con warning conocido de chunks grandes Vite.

## Rollback

Eliminar `registerIfcManifest(...)` de `frontend/src/api/bimModels.js` y retirar
la asercion correspondiente del smoke BIM positivo. No hay cambios de UI ni de
datos que revertir.

## Pendiente posterior

- Crear UX BIM controlada para registrar manifiestos IFC solo cuando el workspace
  BIM visible este autorizado por feature flag.
- Conectar el manifiesto con storage/archivo real y parser IFC en una TASK
  posterior.
