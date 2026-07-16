# BIM-TASK-0064 - Raycasting nativo fragments en harness BIM

Estado: Cerrada localmente

## Objetivo

Avanzar el viewer BIM maduro sobre fragments con un canvas WebGL real de
`FragmentsModels` y raycasting nativo trazable por `localId` y `GlobalId`,
sin depender de paneles simulados ni mocks visuales.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- El harness monta `model.object` de `FragmentsModels` en una escena Three.js
  aislada y registra la camara mediante `model.useCamera(camera)`.
- Se ejecuta `model.raycast({ camera, mouse, dom })` con coordenadas reales del
  canvas.
- El resultado expone `data-bim-fragments-native-raycast`,
  `data-bim-fragments-native-raycast-local-id`,
  `data-bim-fragments-native-raycast-guid` y distancia del hit.
- La UI agrega bloque compacto `Raycast fragments`, alineado con la gramatica de
  Proyectos.
- El smoke DOM valida hit real, localId numerico y GlobalId resuelto.

## Validaciones

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.

## No interferencia clasica

- No se modifican rutas, contratos API, modulos clasicos ni Proyectos clasico.
- BIM permanece en harness/componentes BIM aislados.
- La guarda anti-BIM con flag apagada queda validada.

## Rollback

Revertir los cambios de `BimFragmentsHarness.jsx`,
`validate-bim-viewer-dom.mjs`, `smoke-bim-workspace-positive.mjs` y esta
documentacion.
