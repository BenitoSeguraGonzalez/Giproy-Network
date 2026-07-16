# BIM-TASK-0043 - Dataset IFC geometrico representativo local

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Validar que el harness BIM carga un fragments binario derivado de un IFC
geometrico representativo local y expone identificadores BIM consultables.

## Alcance

- Usar el fixture IFC geometrico controlado del perimetro BIM.
- Cargar bytes fragments con `FragmentsModels` dentro del harness aislado.
- Esperar correctamente `getLocalIds()` y `getGuids()`.
- Endurecer el smoke DOM para exigir localIds y GlobalIds consultables.

## Cambios realizados

- `BimFragmentsHarness.jsx` espera las promesas de `model.getLocalIds()` y
  `model.getGuids()`.
- `validate-bim-viewer-dom.mjs` exige localIds y GlobalIds en desktop/mobile.
- `smoke-bim-workspace-positive.mjs` protege que el harness espere ambos
  identificadores.

## No alcance

- No incorpora dataset real de obra.
- No reemplaza el renderer Three.js por renderer fragments maduro.
- No persiste fragments en backend.
- No activa UX BIM visible en modulos clasicos.

## Validacion

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

## Rollback

Revertir:

- cambios en `frontend/src/components/bim/BimFragmentsHarness.jsx`
- cambios en `frontend/scripts/validate-bim-viewer-dom.mjs`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`
- esta TASK y sus referencias documentales

El rollback no requiere migraciones ni cambios de base de datos.

## Pendiente posterior

- Simulaciones de volumen con datasets reales/representativos.
- Renderer fragments maduro o puente visual avanzado.
