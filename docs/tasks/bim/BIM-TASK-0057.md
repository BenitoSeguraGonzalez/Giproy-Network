# BIM-TASK-0057 - Inspector ItemData profundo en fragments

## Estado

Cerrada localmente.

## Objetivo

Profundizar el frontend BIM sobre `FragmentsModels` con un inspector trazable de
`ItemData`, sin crear paneles falsos ni depender de datos simulados para declarar
madurez.

## Alcance

- `frontend/src/components/bim/BimFragmentsHarness.jsx`
- `frontend/scripts/smoke-bim-workspace-positive.mjs`
- `frontend/scripts/validate-bim-viewer-dom.mjs`
- Documentacion BIM de continuidad.

## Cambios realizados

- El harness fragments resume claves reales de `ItemData` mediante
  `Object.keys(item)`.
- Resuelve `GlobalId` desde atributos `GlobalId`, `globalId`, `guid` o el
  fallback consultado por `getGuids`.
- Resuelve tipo/clase IFC contra `getCategories` y `getItemsOfCategories` si
  el `ItemData` no trae `ObjectType` o `PredefinedType`.
- Expone trazabilidad DOM:
  - `data-bim-fragments-sample-key-count`
  - `data-bim-fragments-sample-keys`
  - `data-bim-fragments-sample-guid-resolved`
  - `data-bim-fragments-sample-type`
- Agrega una banda compacta `Inspector ItemData`, alineada con controles densos
  de Proyectos.

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

Revertir los cambios de `BimFragmentsHarness.jsx` y las aserciones agregadas en
los smokes. El rollback no afecta backend ni persistencia.
