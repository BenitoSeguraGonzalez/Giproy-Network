# BIM-TASK-0075 - Viewport Fragments de producto

Estado: Cerrada localmente

## Objetivo

Integrar el canvas nativo Fragments en `BimWorkspace`, fuera del harness
diagnostico, consumiendo artifacts registrados y datos reales.

## Implementacion

- `BimFragmentsViewport` carga el artifact `fragments` activo mediante API
  tenant-scoped y `FragmentsModels` con worker local.
- Render WebGL con Three.js, OrbitControls, encuadre inicial y canvas propio.
- `ResizeObserver` mantiene dimensiones estables sin tipografia fluida.
- `model.raycast` sobre `pointerdown` resuelve localId/GlobalId y sincroniza la
  seleccion global del workspace por GUID.
- `webglcontextlost` activa recuperacion controlada sin recargar GiProy.
- Cleanup desmonta observer, eventos, controls, FragmentsModels y renderer.
- El viewer Three.js anterior queda como fallback cuando no existe artifact
  Fragments activo.
- Endpoint de contenido valida checksum/contrato antes de servir bytes.

## Validacion

- Harness de producto aislado con bytes Fragments reales.
- Playwright desktop 1440x900, tablet 820x900 y movil 390x844: OK.
- Canvas WebGL no vacio por lectura de pixeles, dimensiones >= 280x360,
  seleccion nativa GlobalId y ausencia de overflow horizontal: OK.
- Screenshots generadas en `%TEMP%/giproy-bim-fragments-{viewport}.png`.
- Build Vite, smoke BIM, endpoint de descarga y anti-BIM: OK.
- Todos los procesos Vite Playwright se cerraron mediante cleanup de PID.

## No interferencia clasica

- Montaje exclusivo en `BimWorkspace` y bajo acceso BIM existente.
- Proyectos clasico conserva BIM forzado apagado.
- Sin cambios en TASK-1807, auth, tenant o infraestructura.

## Rollback

Retirar viewport, harness/validador, endpoint de contenido y montaje BIM; el
viewer Three.js previo vuelve a actuar siempre como fallback.
