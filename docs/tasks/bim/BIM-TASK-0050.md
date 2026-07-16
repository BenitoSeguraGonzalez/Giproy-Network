# BIM-TASK-0050 - Seleccion 3D con raycasting en viewer BIM

## Estado

Cerrada localmente.

## Objetivo

Avanzar el viewer BIM frontend hacia una experiencia 3D operativa, agregando
seleccion real sobre geometria renderizada con Three.js y sincronizacion con el
estado BIM existente.

## Alcance

- Agregar `THREE.Raycaster` en `BimThreeViewer`.
- Detectar mallas BIM seleccionables desde los elementos renderizados.
- Exponer hit 3D con `elementId`, `GlobalId` y clase IFC.
- Sincronizar la seleccion 3D con `selectedElement` del workspace/harness.
- Validar interaccion real en harness DOM/WebGL desktop y mobile.

## Supuestos

- Este slice usa geometria BIM 3D local ya existente en `BimThreeViewer`.
- No declara completo el raycast nativo de `FragmentsModels`; esa puerta queda
  para el viewer fragments maduro.
- La interaccion debe conservar el look & feel de Proyectos: controles compactos
  y estado tecnico visible sin sobredecoracion.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - agrega `THREE.Raycaster`;
  - registra mallas seleccionables;
  - selecciona por `pointerdown` sobre el canvas WebGL;
  - expone `data-bim-three-raycast-*`;
  - muestra estado `Hit 3D` en la superficie del viewer.
- `frontend/src/components/bim/BimWorkspace.jsx`:
  - conecta `onSelectElement` del viewer 3D con el selector BIM existente.
- `frontend/src/features/bim/BimViewerHarness.jsx`:
  - conecta el harness 3D con `setSelectedElement`.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - ejecuta clicks reales sobre el canvas 3D y exige hit trazable.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege raycaster, callback y atributos DOM trazables.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El cambio vive dentro del perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

## Rollback

Revertir los cambios en `BimThreeViewer.jsx`, `BimWorkspace.jsx`,
`BimViewerHarness.jsx` y los dos smokes asociados elimina la seleccion 3D sin
tocar persistencia ni contratos API.
