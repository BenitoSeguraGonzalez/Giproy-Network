# BIM-TASK-0047 - Consulta ItemData desde FragmentsModels

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Elevar el harness fragments de carga binaria a consulta BIM real, exponiendo
datos de item desde `FragmentsModels` mediante `getItemsData`.

## Alcance

- Consultar `localIds`, `GlobalIds` e `ItemData` desde el modelo fragments.
- Exponer una muestra verificable en atributos DOM del harness aislado.
- Endurecer el smoke DOM/WebGL para exigir item data consultable.
- Endurecer el smoke BIM positivo para proteger `getItemsData`.

## Cambios realizados

- `BimFragmentsHarness.jsx` consulta `model.getItemsData([sampleLocalId],
  { attributesDefault: true })`.
- El harness expone:
  - `data-bim-fragments-items`
  - `data-bim-fragments-sample-local-id`
  - `data-bim-fragments-sample-guid`
  - `data-bim-fragments-sample-category`
- `validate-bim-viewer-dom.mjs` exige item data, localId y GlobalId de muestra
  en desktop/mobile.
- `smoke-bim-workspace-positive.mjs` protege la consulta de `ItemData`.

## No alcance

- No activa viewer BIM visible en modulos clasicos.
- No reemplaza aun el renderer Three.js por renderer fragments maduro.
- No incorpora dataset real externo.
- No persiste fragments en backend.

## Validacion

- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

## Rollback

Revertir:

- cambios en `frontend/src/components/bim/BimFragmentsHarness.jsx`
- cambios en `frontend/scripts/validate-bim-viewer-dom.mjs`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`
- esta TASK y sus referencias documentales

El rollback no requiere migraciones ni cambios de base de datos.

## Pendiente posterior

- Renderer fragments maduro o puente visual avanzado.
- Dataset real autorizado y pruebas de rendimiento.
