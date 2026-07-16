# BIM-TASK-0059 - Geometria y medicion fragments en harness BIM

## Estado

Cerrada localmente.

## Objetivo

Exponer geometria y medicion consultable desde `FragmentsModels` en el frontend
BIM, acercando el harness al comportamiento esperado de un viewer BIM maduro.

## Alcance

- `frontend/src/components/bim/BimFragmentsHarness.jsx`
- `frontend/scripts/smoke-bim-workspace-positive.mjs`
- `frontend/scripts/validate-bim-viewer-dom.mjs`
- Documentacion BIM de continuidad.

## Cambios realizados

- El harness consulta:
  - `getItemsWithGeometry()`
  - `getBoxes([sampleLocalId])`
  - `getItemsVolume([sampleLocalId])`
  - `getItemsMaterialDefinition([sampleLocalId])`
- Expone atributos DOM:
  - `data-bim-fragments-geometry-items`
  - `data-bim-fragments-sample-boxes`
  - `data-bim-fragments-sample-volume`
  - `data-bim-fragments-material-definitions`
- Agrega bloque compacto `Geometria fragments`, con items, cajas y volumen.

## Validaciones

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`
- `cmd /c npm run build` desde `frontend`

## No interferencia

- No se tocaron endpoints, auth, tenant, rutas ni modulos clasicos.
- No se activo BIM visible en Proyectos clasico.
- No se crearon migraciones, Dockerfiles, pipelines ni configuracion de deploy.

## Rollback

Revertir las consultas de geometria/medicion en `BimFragmentsHarness.jsx` y las
aserciones asociadas en los smokes. El rollback no afecta backend ni
persistencia.
