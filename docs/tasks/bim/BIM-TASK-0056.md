# BIM-TASK-0056 - Visibilidad IFC 3D operativa en viewer BIM

## Estado

Cerrada localmente.

## Objetivo

Madurar la interfaz 3D BIM con controles de visibilidad por clase IFC dentro del
viewer, manteniendo trazabilidad real sobre los elementos renderizados.

## Alcance

- Derivar clases IFC desde los elementos reales del viewer 3D.
- Ocultar/restaurar clases IFC en la escena 3D local.
- Exponer clases ocultas, clases visibles y elementos filtrados en DOM.
- Agregar reset de visibilidad 3D.
- Validar el comportamiento con interacción real en harness DOM/WebGL.

## Supuestos

- La visibilidad local 3D es una puerta previa a visibilidad nativa sobre
  `FragmentsModels`.
- No se agregan endpoints, migraciones, dependencias ni persistencia nueva.
- Los controles deben seguir el lenguaje compacto de Proyectos.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - agrega `hiddenIfcClasses`;
  - agrega `toggleIfcClassVisibility(...)`;
  - filtra `visibleThreeElements` considerando clases ocultas;
  - expone `data-bim-three-hidden-ifc-classes` y
    `data-bim-three-visible-ifc-classes`;
  - agrega controles `Visibilidad 3D` y reset.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - pulsa un control real de visibilidad IFC 3D;
  - valida reduccion de elementos visibles y reset.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege visibilidad IFC 3D operativa con reset trazable.

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
la visibilidad IFC 3D sin tocar persistencia ni contratos API.
