# BIM-TASK-0062 - Trazabilidad GUID bidireccional en fragments

Estado: Cerrada localmente

## Objetivo

Validar trazabilidad bidireccional real entre `localId` y `GlobalId` en el
harness fragments, como base para seleccion, auditoria y viewer 3D maduro.

## Alcance

- Frontend BIM aislado.
- `BimFragmentsHarness.jsx`.
- Smokes frontend BIM y DOM.

## Cambios

- Se agrega roundtrip `getGuidsByLocalIds([localId])` ->
  `getLocalIdsByGuids([GlobalId])`.
- El harness expone `data-bim-fragments-roundtrip-guid`,
  `data-bim-fragments-roundtrip-local-id` y
  `data-bim-fragments-roundtrip-matched`.
- La UI agrega bloque compacto `Trazabilidad GUID`.
- Los smokes exigen GUID resuelto, localId resuelto y match positivo.

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
