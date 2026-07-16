# BIM-TASK-0058 - Estructura espacial real en harness fragments

## Estado

Cerrada localmente.

## Objetivo

Exponer jerarquia espacial consultable desde `FragmentsModels` en el frontend
BIM, manteniendo controles reales y trazables dentro del harness aislado.

## Alcance

- `frontend/src/components/bim/BimFragmentsHarness.jsx`
- `frontend/scripts/smoke-bim-workspace-positive.mjs`
- `frontend/scripts/validate-bim-viewer-dom.mjs`
- Documentacion BIM de continuidad.

## Cambios realizados

- El harness consulta `model.getSpatialStructure()`.
- Se resume la jerarquia con conteo de nodos, profundidad, hijos de raiz y
  nombre/tipo raiz.
- Se exponen atributos DOM:
  - `data-bim-fragments-spatial-nodes`
  - `data-bim-fragments-spatial-depth`
  - `data-bim-fragments-spatial-root-children`
  - `data-bim-fragments-spatial-root-name`
- Se agrega bloque compacto `Estructura espacial` alineado visualmente con los
  controles densos de Proyectos.

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

Revertir la consulta `getSpatialStructure()`, el resumen espacial y las
aserciones DOM/static asociadas. El rollback no afecta backend ni persistencia.
