# BIM-TASK-0051 - Navegacion 3D profesional con OrbitControls

## Estado

Cerrada localmente.

## Objetivo

Madurar el viewer BIM 3D frontend sustituyendo la autorrotacion demostrativa
por navegacion 3D operativa mediante `OrbitControls`, con reset de camara y
validacion visual en harness.

## Alcance

- Integrar `OrbitControls` desde Three.js en `BimThreeViewer`.
- Mantener render WebGL local y seleccion 3D por raycasting.
- Agregar reset de camara con control compacto alineado con Proyectos.
- Exponer trazabilidad DOM de navegacion 3D.
- Proteger el comportamiento con smoke BIM positivo y harness DOM/WebGL.

## Supuestos

- La navegacion 3D profesional es requisito previo para un viewer BIM maduro.
- Este slice no introduce dependencias nuevas fuera del stack Three.js ya
  autorizado.
- El viewer fragments maduro queda pendiente para raycasting nativo sobre
  `FragmentsModels` y datasets reales.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - importa `OrbitControls`;
  - configura damping, panning y limites de distancia;
  - elimina dependencia de autorrotacion;
  - agrega boton compacto `Reset vista 3D`;
  - expone `data-bim-three-controls="orbit"`.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - exige navegacion OrbitControls y control visible en desktop/mobile.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege import, configuracion de `OrbitControls`, reset de camara y ausencia
    de autorrotacion.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El cambio vive dentro del perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.

## Rollback

Revertir los cambios en `BimThreeViewer.jsx` y los dos smokes asociados
restaura la escena 3D previa sin tocar persistencia ni contratos API.
