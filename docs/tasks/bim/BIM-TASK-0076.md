# BIM-TASK-0076 - Shell UX profesional

Estado: Cerrada localmente

## Objetivo

Convertir `BimWorkspace` en una superficie tecnica compacta y operativa, con
contexto BIM permanente, controles reales, explorer e inspector adaptables.

## Implementacion

- `BimShellContextBar` mantiene visibles empresa, proyecto, modelo y version.
- Toolbar compacta con iconos y tooltips para alternar Fragments/2D, mostrar u
  ocultar explorer e inspector, restablecer contexto y actualizar workspace.
- Todos los controles exponen nombre accesible, estado `aria-pressed`, foco
  visible y operacion por teclado.
- El layout cambia sus tracks segun explorer/inspector sin paneles vacios.
- El canvas Fragments queda como vista principal y el plano BIM 2D como modo
  alternativo; el viewer Three.js anterior conserva su funcion de fallback.
- Las herramientas administrativas de carga permanecen disponibles para
  superadministrador, colapsadas por defecto para no ocupar el area de trabajo.
- Se eliminaron cuatro botones decorativos que no ejecutaban acciones.

## Validacion

- `npm run build`: OK; solo warning conocido de chunk grande.
- `validate-bim-shell-dom.mjs`: OK en 1440x900, 820x900 y 390x844.
- Contexto completo visible, navegacion de toolbar por teclado, modos 3D/2D,
  explorer, inspector, reset y refresh operativos: OK.
- Canvas Fragments real cargado y ausencia de overflow horizontal: OK.
- Revision visual de screenshots desktop y movil: sin overlap y texto legible.
- `smoke-bim-workspace-positive.mjs`: OK.
- `smoke-classic-no-bim-contamination.mjs`: OK.
- Guardas de `axiosConfig` y `console.log` fuera de `src/api`: OK.
- Los procesos Vite/Playwright terminaron y su arbol PID fue limpiado.

## No interferencia clasica

- Cambios limitados a componentes/harness/scripts BIM y documentacion BIM.
- La shell solo se monta tras las guardas BIM existentes.
- Sin cambios en rutas, contratos, auth, tenant, TASK-1807 o infraestructura.

## Rollback

Retirar `BimShellContextBar`, harness/validador y restaurar la composicion
anterior de `BimWorkspace`; no requiere migracion ni cambio de datos.
