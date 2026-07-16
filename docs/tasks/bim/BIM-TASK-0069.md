# BIM-TASK-0069 - Seleccion por puntero en canvas fragments nativo

Estado: Cerrada localmente

## Objetivo

Convertir el raycasting nativo fragments en una interaccion real de usuario
sobre el canvas, manteniendo seleccion, `ItemData`, `GlobalId` y clase IFC
trazables.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- `readNativeRaycast` acepta coordenadas prioritarias de puntero y conserva
  fallback al centro del canvas.
- El canvas WebGL nativo registra `pointerdown` y ejecuta `model.raycast` con
  coordenadas reales del evento.
- El harness expone `data-bim-fragments-native-pointer-selection="enabled"` y
  operacion `seleccion nativa por puntero`.
- La UI agrega indicador compacto `Puntero activo`, alineado con los controles
  existentes del harness BIM.
- El smoke DOM dispara `PointerEvent` real sobre el canvas fragments nativo y
  valida `localId`, `GlobalId`, `ItemData` y operacion trazable.

## Validaciones

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node scripts\smoke-classic-no-bim-contamination.mjs` desde
  `frontend`: OK.
- `cmd /c npm run build` desde `frontend`: OK, con warning conocido de chunks
  grandes Vite/CronogramaGantt.
- `rg "console\.log" frontend/src -n`: sin resultados.
- `rg "axiosConfig" frontend/src/components frontend/src/hooks frontend/src/context frontend/src/features frontend/src/pages -n`: sin resultados.

## No interferencia clasica

- No se modifican rutas, contratos API, modulos clasicos ni Proyectos clasico.
- BIM permanece en harness/componentes BIM aislados.
- La guarda anti-BIM con flag apagada queda validada.

## Rollback

Revertir los cambios de `BimFragmentsHarness.jsx`,
`validate-bim-viewer-dom.mjs`, `smoke-bim-workspace-positive.mjs` y esta
documentacion.
