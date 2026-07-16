# BIM-TASK-0060 - Medicion por categoria IFC en fragments

## Estado

Cerrada localmente.

## Objetivo

Extender los controles reales de categoria IFC del harness fragments para que
expongan medicion agregada por categoria, no solo visibilidad.

## Alcance

- `frontend/src/components/bim/BimFragmentsHarness.jsx`
- `frontend/scripts/smoke-bim-workspace-positive.mjs`
- `frontend/scripts/validate-bim-viewer-dom.mjs`
- Documentacion BIM de continuidad.

## Cambios realizados

- `readCategoryMetrics` ahora consulta medicion agregada sobre los localIds de
  la categoria activa.
- Se usan APIs reales de `FragmentsModels`:
  - `getItemsVolume(localIds)`
  - `getMergedBox(localIds)`
  - `getItemsMaterialDefinition(localIds)`
- Se exponen atributos DOM:
  - `data-bim-fragments-category-volume`
  - `data-bim-fragments-category-box`
  - `data-bim-fragments-category-materials`
- La UI agrega bloque compacto `Medicion categoria` alineado con los controles
  densos del modulo Proyectos.

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

Revertir las metricas agregadas en `readCategoryMetrics`, el bloque visual
`Medicion categoria` y las aserciones asociadas en los smokes. El rollback no
afecta backend ni persistencia.
