# BIM-TASK-0054 - Inspector 3D contextual del viewer BIM

## Estado

Cerrada localmente.

## Objetivo

Madurar el frontend BIM con un inspector 3D compacto, alineado con el lenguaje
visual de Proyectos, que lea datos reales del elemento bajo hover, seleccion o
estado activo del viewer.

## Alcance

- Mostrar inspector 3D dentro de `BimThreeViewer`.
- Priorizar el elemento bajo hover y usar seleccion como fallback.
- Exponer `elementId`, `GlobalId` y conteo de propiedades en DOM.
- Renderizar clase IFC, nombre, `GlobalId`, propiedades, material y sistema
  cuando existan en los datos BIM.
- Validar el comportamiento con smoke estatico y harness DOM/WebGL.

## Supuestos

- El inspector usa datos ya presentes en los elementos BIM o en el artefacto
  optimizado de viewer; no introduce mocks visuales.
- No se agregan endpoints, migraciones ni persistencia nueva.
- El inspector local es una puerta previa a propiedades nativas sobre
  `FragmentsModels` con dataset real autorizado.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - agrega `inspectedSceneElement` derivado de hover, hit o seleccion;
  - expone `data-bim-three-inspector-*`;
  - muestra inspector 3D con nombre, clase IFC, `GlobalId`, propiedades,
    material y sistema cuando existen.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - exige inspector 3D visible y trazable en desktop/mobile.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege que el inspector use datos reales del elemento y `GlobalId`.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El cambio vive dentro del perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite/CronogramaGantt.

## Rollback

Revertir los cambios en `BimThreeViewer.jsx` y los dos smokes asociados elimina
el inspector 3D sin tocar persistencia ni contratos API.
