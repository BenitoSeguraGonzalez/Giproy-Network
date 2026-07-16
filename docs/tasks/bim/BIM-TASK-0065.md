# BIM-TASK-0065 - Seleccion ItemData nativa fragments en harness BIM

Estado: Cerrada localmente

## Objetivo

Conectar el hit real de `model.raycast` en fragments con `ItemData` del
elemento impactado, exponiendo claves, tipo/categoria y nombre trazables en DOM
sin mocks visuales ni paneles simulados.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- El harness resuelve `model.getItemsData([localId])` a partir del `localId`
  devuelto por `model.raycast`.
- Se expone `data-bim-fragments-native-selection-key-count`,
  `data-bim-fragments-native-selection-keys`,
  `data-bim-fragments-native-selection-name`,
  `data-bim-fragments-native-selection-type` y
  `data-bim-fragments-native-selection-category`.
- La UI agrega bloque compacto `Seleccion fragments`, alineado con la gramatica
  de Proyectos.
- El smoke DOM valida que la seleccion nativa tenga claves reales y tipo o
  categoria resuelta desde fragments.

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
