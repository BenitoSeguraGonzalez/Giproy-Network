# BIM-TASK-0049 - Filtro operativo IFC en canvas BIM

## Estado

Cerrada localmente.

## Objetivo

Elevar el frontend BIM 2D desde visualizacion basica hacia una superficie de
trabajo mas operativa, agregando un filtro real por clase IFC sobre los
elementos cargados en el canvas, alineado con el patron compacto de controles de
`Proyectos`.

## Alcance

- Agregar estado de filtro por clase IFC en `BimCanvasViewer`.
- Derivar clases IFC disponibles desde `elements` reales del workspace.
- Filtrar el canvas por clase IFC antes de aplicar filtros secundarios.
- Exponer atributos DOM trazables para smoke visual.
- Proteger el comportamiento con smoke BIM positivo y harness DOM.

## Supuestos

- El canvas 2D sigue siendo un entorno BIM aislado, no una exposicion visible en
  Proyectos clasico.
- La fuente de verdad del filtro son los elementos BIM ya recibidos por el
  componente, no datos mock ni listas fijas.
- El look & feel debe mantenerse cerca de Proyectos: botones compactos, chips
  tecnicos y estados visibles sin ocupar excesivo espacio.

## Cambios realizados

- `frontend/src/components/bim/BimCanvasViewer.jsx`:
  - agrega `activeIfcClass`;
  - calcula `ifcClassFilters` desde `elements`;
  - filtra `filteredElements` por clase IFC activa;
  - agrega controles compactos `Todas` y clases IFC detectadas;
  - expone `data-bim-canvas-ifc-filter`,
    `data-bim-canvas-filtered-elements` y
    `data-bim-canvas-ifc-filter-count`.
- `frontend/scripts/validate-bim-viewer-dom.mjs`:
  - exige filtro IFC activo inicial, conteo de clases y elementos filtrados;
  - valida que el harness renderice clases IFC representativas.
- `frontend/scripts/smoke-bim-workspace-positive.mjs`:
  - protege que el canvas conserve filtro operativo por clase IFC y atributos
    DOM trazables.

## No interferencia

- No se tocaron rutas, auth, tenant, contratos clasicos, backend, migraciones ni
  DB real.
- `Proyectos.jsx` conserva BIM apagado mediante `CLASSIC_BIM_ACCESS_DISABLED`.
- El filtro vive en perimetro BIM frontend.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, warning conocido por chunk
  `CronogramaGantt`.

## Rollback

Revertir los cambios en `BimCanvasViewer.jsx` y en los dos smokes asociados
restaura el canvas anterior sin tocar persistencia ni contratos API.
