# BIM-TASK-0035 - IFC/3D como fundamento de cierre BIM

## Estado

Cerrada localmente.

## Objetivo

Elevar IFC/3D a requisito central del cierre BIM e introducir una fundacion
frontend 3D aislada, validable y alineada con el stack congelado del plan
maestro, sin activar BIM visible en GiProy Clasico.

## Alcance

- Instalar dependencias BIM/3D autorizadas:
  - `three`
  - `web-ifc`
  - `@thatopen/components`
  - `@thatopen/components-front`
  - `@thatopen/fragments`
- Agregar viewer BIM 3D aislado en `frontend/src/components/bim`.
- Mantener el viewer tecnico 2D existente como superficie de incubacion.
- Integrar el viewer 3D solo dentro del workspace BIM y del harness aislado.
- Endurecer smokes para exigir dependencias IFC/3D y canvas WebGL no vacio.
- Actualizar documentacion BIM y plantilla de lanzamiento BIM.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx` crea una escena Three.js
  local con elementos BIM extruidos desde `geometry_2d`, estados de seleccion,
  elementos vinculados y metadatos de version/nivel.
- `frontend/src/components/bim/BimWorkspace.jsx` monta el viewer 3D dentro del
  perimetro BIM, junto al viewer tecnico existente.
- `frontend/src/features/bim/BimViewerHarness.jsx` renderiza viewer tecnico y
  viewer 3D en un harness aislado.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` exige el componente 3D,
  dependencias IFC/3D autorizadas y uso de Three.js/WebGL.
- `frontend/scripts/validate-bim-viewer-dom.mjs` valida canvas 2D y canvas 3D
  en desktop/mobile, incluyendo dimensiones, visibilidad y pixeles no vacios.
- `frontend/vite.config.js` separa `three`, `web-ifc` y paquetes `@thatopen`
  en chunk `bim-3d`.
- `frontend/package.json` y `frontend/package-lock.json` incorporan el stack
  BIM/3D autorizado.

## No interferencia

- No se activa `BimTab` en `Proyectos`.
- No se modifican endpoints clasicos ni contratos de EDT, APUs, Presupuesto,
  Cronogramas, auth, JWT o tenant.
- No se crea backend separado.
- No se toca servidor, Docker, Coolify, staging ni produccion.
- El viewer 3D vive solo en perimetros BIM y harness local.

## Validacion

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_alembic_migration.py`: OK, 36 passed.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs`: OK, canvas 2D y canvas WebGL 3D visibles/no vacios.
- `npm run build`: OK, con warning conocido de chunk grande `CronogramaGantt`.

## Limitaciones explicitas

- Esta TASK no implementa parsing IFC semantico completo.
- Esta TASK no genera fragments ni artefactos optimizados.
- Esta TASK no activa navegacion cruzada visible con modulos clasicos.

## Pendiente posterior

- `BIM-TASK-0036`: pipeline local IFC real: carga de archivo, checksum,
  validacion, parsing semantico inicial con `web-ifc`/That Open y persistencia
  BIM de storeys/elementos/propiedades.
- `BIM-TASK-0037`: simulaciones BIM S1/S2/S3 con datasets representativos,
  metricas de carga, estabilidad y navegacion 3D.

## Rollback

Revertir `BimThreeViewer.jsx`, su montaje en `BimWorkspace` y harness, los
ajustes de smokes, `vite.config.js`, `package.json`, `package-lock.json` y esta
documentacion. BIM vuelve al viewer tecnico 2D sin afectar GiProy Clasico.
