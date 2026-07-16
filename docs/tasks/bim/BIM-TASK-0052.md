# BIM-TASK-0052 - Foco 3D de elemento seleccionado

## Estado

Cerrada localmente.

## Objetivo

Madurar el viewer BIM 3D agregando foco operativo sobre el elemento BIM
seleccionado, usando la geometria real renderizada en `BimThreeViewer` y el
estado BIM existente.

## Alcance

- Derivar el elemento 3D seleccionado desde `selectedElement`.
- Ajustar camara y target de `OrbitControls` hacia el elemento.
- Exponer foco 3D con `elementId` y `GlobalId` trazables.
- Validar el control con click real en harness DOM/WebGL.

## Supuestos

- El foco 3D local es una puerta previa al viewer fragments maduro.
- No se declara completo el foco sobre `FragmentsModels`; queda pendiente para
  datasets reales y raycasting nativo fragments.
- El control debe conservar el lenguaje compacto de Proyectos.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - calcula `selectedSceneElement`;
  - agrega `handleFocusSelectedElement`;
  - mueve camara y `OrbitControls.target` al elemento seleccionado;
  - expone `data-bim-three-focus-element` y
    `data-bim-three-focus-global-id`;
  - agrega boton `Enfocar elemento`.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - hace click real sobre `Enfocar elemento`;
  - exige foco DOM y `GlobalId` trazable.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege foco 3D, boton y trazabilidad DOM.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El cambio vive dentro del perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

## Rollback

Revertir los cambios en `BimThreeViewer.jsx` y los dos smokes asociados elimina
el foco 3D sin tocar persistencia ni contratos API.
