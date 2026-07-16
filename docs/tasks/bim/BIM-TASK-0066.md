# BIM-TASK-0066 - Visibilidad de seleccion nativa fragments en harness BIM

Estado: Cerrada localmente

## Objetivo

Convertir la seleccion nativa fragments en una accion operativa: alternar la
visibilidad del `localId` seleccionado por `model.raycast` usando APIs reales de
`FragmentsModels`, con estado verificable en DOM.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- La seleccion nativa expone `data-bim-fragments-native-selection-visible`.
- Se agrega control compacto `Sel.` con icono para alternar visibilidad del
  elemento seleccionado.
- El control ejecuta `model.toggleVisible([localId])`, refresca fragments y
  vuelve a renderizar el canvas nativo.
- El smoke DOM pulsa el control y valida cambio/restauracion de visibilidad.

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
