# BIM-TASK-0042 - Carga de fragments con FragmentsModels en harness

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Validar que el frontend BIM puede cargar bytes fragments binarios con
`FragmentsModels` dentro de un harness aislado, sin activar UX BIM visible fuera
del perimetro BIM.

## Alcance

- Agregar fixture binario fragments controlado a partir del smoke de
  `IfcImporter`.
- Crear componente BIM dedicado para cargar el fragments con
  `FragmentsModels.load(...)`.
- Montar la carga fragments dentro de `BimViewerHarness`.
- Endurecer el smoke DOM para exigir estado `loaded`, bytes no vacios y modelo
  registrado.

## Cambios realizados

- Se agrega `frontend/src/components/bim/bimFragmentsBinaryFixture.js`.
- Se agrega `frontend/src/components/bim/BimFragmentsHarness.jsx`.
- `BimViewerHarness.jsx` monta `BimFragmentsHarness` sobre los viewers 2D/3D.
- `validate-bim-viewer-dom.mjs` valida carga fragments en desktop/mobile.
- `smoke-bim-workspace-positive.mjs` protege el wiring de `FragmentsModels`.

## No alcance

- El fixture sintético no representa aun geometría BIM madura ni datasets reales.
- No se reemplaza el viewer Three.js existente por renderer nativo de fragments.
- No se persisten fragments en backend.
- No se activan rutas ni pestañas clásicas.

## Validacion

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## Rollback

Revertir:

- `frontend/src/components/bim/BimFragmentsHarness.jsx`
- `frontend/src/components/bim/bimFragmentsBinaryFixture.js`
- cambios en `frontend/src/features/bim/BimViewerHarness.jsx`
- cambios en `frontend/scripts/validate-bim-viewer-dom.mjs`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`

El rollback no requiere migraciones ni cambios de base de datos.

## Pendiente posterior

- `BIM-TASK-0043`: fixture/dataset IFC con geometría real consultable.
- `BIM-TASK-0045`: renderer fragments maduro o puente visual avanzado.
