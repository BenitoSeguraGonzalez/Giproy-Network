# BIM-TASK-0078 - Herramientas de revision

Estado: Cerrada localmente

## Objetivo

Incorporar herramientas de revision operativas sobre el modelo Fragments real,
con estado visible y reset reversible.

## Implementacion

- Ocultar seleccion mediante `toggleVisible`.
- Aislar seleccion mediante `resetVisible`, ocultacion total y restauracion del
  localId activo, siguiendo el patron certificado del harness Fragments.
- Ghost reversible mediante `setOpacity`/`resetOpacity`.
- Clipping horizontal mediante `THREE.Plane`, callback Fragments y slider.
- Medicion real mediante `getItemsVolume` y `getMergedBox`.
- Proyeccion perspectiva/ortografica con camara enlazada por `model.useCamera`.
- Reset restaura visibilidad, opacidad, highlights, clipping, proyeccion y camara.
- Unidades m/mm persistidas en `giproy_bim_measurement_unit`.

## Validacion

- Smoke Playwright por herramienta sobre bytes Fragments reales: OK.
- Desktop 1280x820 y movil 390x844 ejecutan seleccion, medicion, ghost,
  proyeccion, clipping, aislamiento, ocultacion y reset: OK.
- Canvas no vacio, estado DOM trazable, unidades persistentes y sin overflow.
- Matriz de producto Fragments desktop/tablet/movil: OK en 7.6 s.
- Build Vite, smoke BIM y anti-BIM: OK.
- Todos los procesos monitorizados; un proceso elevado anomalo fue terminado y
  el puerto 4223 quedo limpio antes de relanzar por viewport.

## No interferencia clasica

- Cambios exclusivos del viewport Fragments BIM y su validador aislado.
- Sin contratos clasicos, persistencia, auth, tenant, TASK-1807 o infraestructura.

## Rollback

Retirar toolbar/estado de revision y su validador; el viewport Fragments vuelve
a carga, navegacion y seleccion sin alterar artifacts ni datos persistidos.
