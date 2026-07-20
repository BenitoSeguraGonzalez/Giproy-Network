# BIM-TASK-0171 - Servicios cartograficos BIM

Fecha: 2026-07-20
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar H05 con un catalogo operativo de capas XYZ/WMS por tenant, proyecto
y revision, integrado con la georreferenciacion BIM existente.

## Alcance ejecutado

- Migracion aditiva `de2054a1b2c3` para catalogos cartograficos revisados.
- Contrato validado de capas base y overlays con URL, zoom, opacidad, orden y
  visibilidad; una sola capa base puede estar visible.
- API BIM protegida para consultar y guardar catalogos bajo `bim.coordinate`.
- Controles compactos Leaflet para activar, ocultar, graduar y agregar
  servicios XYZ/WMS dentro de la pestaña Ubicacion.

## Validacion

- 6 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2054`: correcto.
- Build Vite, 32 smokes BIM, anti-BIM y baseline enterprise: correctos.
- Playwright e inspeccion visual en 1920x900 y 2560x1300: sin canvas vacio,
  solapamientos ni overflow horizontal.

## No interferencia clasica

No se modifican tablas, APIs, pantallas ni mapas clasicos. Los servicios se
persisten exclusivamente en `bim_map_catalogs` y se consumen dentro del
workspace BIM protegido.

## Rollback

Ocultar BIM, retirar los endpoints y cliente de catalogo, restaurar el panel
de georreferencia anterior y revertir `de2054a1b2c3`.

## Resultado

H05 queda completa. Paridad: 84,17%. Programa: 45/61 slices, 73,77% realizado
y 26,23% pendiente. Sin deploy.
