# BIM-TASK-0068 - Filtro de categoria en canvas fragments nativo

Estado: Cerrada localmente

## Objetivo

Conectar un filtro operativo por categoria IFC al canvas fragments nativo,
usando localIds reales de `FragmentsModels` y controles compactos alineados con
Proyectos.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- Se agrega el control compacto `Solo cat.` para aislar la categoria IFC activa
  en el canvas fragments nativo.
- El filtro usa `getLocalIds`, `getItemsOfCategories`, `resetVisible`,
  `toggleVisible` y re-render explicito del canvas nativo.
- El harness expone estado trazable mediante
  `data-bim-fragments-native-category-filter` y
  `data-bim-fragments-native-category-filtered-local-ids`.
- El smoke DOM pulsa el filtro, valida localIds reales de categoria, operacion
  `categoria aislada` y rollback por reset a filtro total.

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
