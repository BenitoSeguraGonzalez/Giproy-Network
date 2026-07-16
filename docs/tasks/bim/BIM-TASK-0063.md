# BIM-TASK-0063 - ItemData batch por categoria IFC en fragments

Estado: Cerrada localmente

## Objetivo

Ampliar el inspector frontend BIM para consultar `ItemData` real por categoria
IFC activa, evitando paneles decorativos y preparando seleccion/inspeccion
madura sobre fragments.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- `readCategoryMetrics` consulta `getItemsData` sobre una muestra de localIds
  reales de la categoria IFC activa.
- El harness expone `data-bim-fragments-category-itemdata`,
  `data-bim-fragments-category-item-key-count` y
  `data-bim-fragments-category-item-keys`.
- La UI agrega bloque compacto `ItemData categoria`, alineado con controles de
  Proyectos.
- Los smokes exigen items, claves y nombres de claves reales.

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
