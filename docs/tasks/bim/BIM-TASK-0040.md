# BIM-TASK-0040 - Consumo de artefacto viewer en harness 3D

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Conectar el artefacto optimizado JSON generado por `BIM-TASK-0039` con el
viewer BIM 3D aislado, de forma que el cierre IFC/3D tenga una ruta comprobable
desde artefacto persistible hasta canvas WebGL.

## Alcance

- Crear adaptador frontend BIM para transformar
  `giproy_bim_viewer_artifact` en elementos consumibles por `BimThreeViewer`.
- Mantener fallback a elementos BIM existentes cuando no haya artefacto.
- Endurecer el harness BIM para simular el flujo artefacto viewer -> Three.js.
- Ampliar smokes BIM para verificar adaptador, atributos DOM de fuente de
  artefacto y canvas 3D no vacio.

## Cambios realizados

- Se agrega `frontend/src/components/bim/bimViewerArtifactAdapter.js`.
- `BimThreeViewer.jsx` acepta `viewerArtifact`, lo normaliza mediante el
  adaptador y expone `data-bim-artifact-source` /
  `data-bim-artifact-elements`.
- `BimViewerHarness.jsx` incluye un artefacto `giproy_bim_viewer_artifact`
  representativo y lo pasa al viewer 3D.
- `smoke-bim-workspace-positive.mjs` valida presencia del adaptador y wiring
  del artefacto.
- `validate-bim-viewer-dom.mjs` valida en desktop/mobile que el viewer 3D
  consume `viewer-artifact`, renderiza tres elementos y mantiene canvas WebGL
  no vacio sin overflow horizontal.

## No alcance

- No se agregan fragments binarios.
- No se incorporan quantities, materiales ni sistemas.
- No se activa navegacion BIM visible fuera del harness/workspace BIM.
- No se despliega a servidor.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## Rollback

Revertir:

- `frontend/src/components/bim/bimViewerArtifactAdapter.js`
- cambios en `frontend/src/components/bim/BimThreeViewer.jsx`
- cambios en `frontend/src/features/bim/BimViewerHarness.jsx`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`
- cambios en `frontend/scripts/validate-bim-viewer-dom.mjs`

El rollback no requiere cambios de base de datos ni migraciones.

## Pendiente posterior

- `BIM-TASK-0041`: fragments binarios con stack That Open.
- quantities, materiales y sistemas desde IFC.
- `BIM-TASK-0043`: datasets IFC representativos y simulaciones de volumen.
