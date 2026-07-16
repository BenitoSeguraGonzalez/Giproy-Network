# BIM-TASK-0055 - Filtro IFC 3D operativo en viewer BIM

## Estado

Cerrada localmente.

## Objetivo

Extender la madurez frontend del viewer BIM con filtros por clase IFC dentro de
la escena 3D, usando elementos reales del workspace o del artefacto optimizado
del viewer.

## Alcance

- Derivar clases IFC desde los elementos reales del viewer 3D.
- Filtrar la escena 3D por clase IFC sin tocar backend ni contratos.
- Exponer filtro activo, cantidad filtrada y cantidad de filtros en DOM.
- Mantener controles compactos alineados con el lenguaje de Proyectos.

## Supuestos

- El filtro 3D local complementa el filtro 2D existente y es una puerta previa
  al filtrado nativo sobre `FragmentsModels`.
- No se agregan dependencias, endpoints, migraciones ni persistencia nueva.
- La escena 3D debe seguir funcionando con artefactos viewer y con elementos
  del workspace.

## Cambios realizados

- `frontend/src/components/bim/BimThreeViewer.jsx`:
  - agrega `activeIfcClass`;
  - deriva `ifcClassFilters`;
  - renderiza `visibleThreeElements`;
  - expone `data-bim-three-ifc-filter`,
    `data-bim-three-filtered-elements` y
    `data-bim-three-ifc-filter-count`;
  - agrega controles compactos `IFC 3D`.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - exige filtros IFC 3D trazables en desktop/mobile.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege el filtro IFC 3D como comportamiento real.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El cambio vive dentro del perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunks grandes
  Vite/CronogramaGantt.

## Rollback

Revertir los cambios en `BimThreeViewer.jsx` y los dos smokes asociados elimina
el filtro IFC 3D sin tocar persistencia ni contratos API.
