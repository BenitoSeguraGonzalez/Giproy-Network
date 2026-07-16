# BIM-TASK-0061 - Subset fragments por categoria IFC

Estado: Cerrada localmente

## Objetivo

Agregar trazabilidad operativa de exportacion/subset sobre categorias IFC reales
del harness fragments, sin mocks visuales y sin tocar flujos clasicos.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- `readCategoryMetrics` consulta `getSubsetBuffer(localIds, false)` sobre los
  localIds reales de la categoria IFC activa.
- El harness expone `data-bim-fragments-category-subset-bytes`.
- La UI agrega bloque compacto `Subset fragments`, alineado con controles de
  Proyectos.
- Los smokes verifican API nativa, atributo DOM y bytes positivos.

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
