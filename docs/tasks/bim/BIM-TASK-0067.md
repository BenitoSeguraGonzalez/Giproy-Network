# BIM-TASK-0067 - Visibilidad por categoria en canvas fragments nativo

Estado: Cerrada localmente

## Objetivo

Hacer que los controles de visibilidad por categoria IFC operen tambien sobre
el canvas fragments nativo, con re-render explicito y validacion DOM del cambio
de visibles/ocultos.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- Se agrega re-render explicito del canvas fragments nativo tras alternar
  categoria o restaurar visibilidad.
- Los controles de categoria exponen
  `data-bim-fragments-category-visibility-toggle` y
  `data-bim-fragments-category-visibility-reset`.
- El smoke DOM pulsa los controles, valida reduccion de visibles, aumento de
  ocultos y restauracion completa con operacion trazable.

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
