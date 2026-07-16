# BIM-TASK-0053 - Hover 3D con raycasting trazable

## Estado

Cerrada localmente.

## Objetivo

Madurar el viewer BIM 3D agregando feedback de hover sobre elementos BIM
renderizados, usando el mismo `THREE.Raycaster` del viewer y exponiendo datos
trazables del elemento bajo el puntero.

## Alcance

- Detectar hover 3D por `pointermove` en el canvas WebGL.
- Exponer `elementId`, `GlobalId` y clase IFC del hover.
- Mostrar estado `Hover 3D` dentro del viewer.
- Validar el comportamiento con eventos reales en harness DOM/WebGL.

## Supuestos

- El hover 3D local es una puerta de madurez previa al hover nativo sobre
  `FragmentsModels`.
- No se agregan dependencias nuevas ni se toca backend.
- El estado visual debe permanecer compacto y consistente con Proyectos.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - reutiliza el raycaster para hover;
  - agrega `raycastHover`;
  - escucha `pointermove` y `pointerleave`;
  - expone `data-bim-three-hover-*`;
  - muestra `Hover 3D` en el overlay tecnico.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - dispara `pointermove` real sobre el canvas 3D;
  - exige hover con `GlobalId` y clase IFC trazables.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege hover 3D operativo con DOM trazable.

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
el hover 3D sin tocar persistencia ni contratos API.
