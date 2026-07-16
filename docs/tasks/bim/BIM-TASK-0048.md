# BIM-TASK-0048 - Inspector y controles frontend de fragments consultables

## Estado

Cerrada localmente.

## Objetivo

Hacer visible y operable en el frontend BIM aislado el estado real de
`FragmentsModels`, manteniendo el look & feel operativo de Proyectos y evitando
que el motor IFC/3D quede solo como dato tecnico oculto en atributos DOM.

## Alcance

- Ajustar `BimFragmentsHarness.jsx` dentro de `frontend/src/components/bim`.
- Mostrar estado, bytes, modelos, localIds, GlobalId e `ItemData` consultable.
- Agregar controles reales de categoria IFC y visibilidad sobre el modelo
  fragments cargado.
- Mantener la superficie compacta, sobria y alineada con Proyectos.
- Reforzar smokes para exigir inspector visible y ausencia de overflow.

## Cambios

- `BimFragmentsHarness.jsx` muestra un inspector `Motor BIM / fragments` con:
  - estado `Fragments consultables`;
  - muestra `LocalId`;
  - muestra `GlobalId`;
  - muestra `ItemData`;
  - chips de bytes, modelos, ids e item data.
- `BimFragmentsHarness.jsx` usa API real de fragments:
  - `getCategories`;
  - `getItemsOfCategories`;
  - `getVisible`;
  - `toggleVisible`;
  - `resetVisible`;
  - `getItemsByVisibility`.
- El harness expone atributos DOM trazables de categoria activa, localIds,
  visibles, ocultos y totales de visibilidad.
- `validate-bim-viewer-dom.mjs` exige que el inspector fragments sea visible en
  desktop y mobile, sin overflow y con controles de categoria/visibilidad.
- `smoke-bim-workspace-positive.mjs` protege el contrato visual y funcional del
  inspector.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `cmd /c node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK, con warning conocido de chunk grande
  `CronogramaGantt`.

## No interferencia

- Sin cambios en backend, migraciones, DB real, auth, tenant ni contratos API.
- Sin activar UX BIM en Proyectos clasico.
- Sin imports directos de `axiosConfig`.
- Sin `console.log` productivo.
- Sin Docker, Coolify, CI/CD, staging ni produccion.

## Pendiente recomendado

- Evolucionar el viewer 3D maduro sobre fragments con dataset real autorizado.
- Conectar seleccion visual real de fragments cuando el renderer maduro este
  listo.
