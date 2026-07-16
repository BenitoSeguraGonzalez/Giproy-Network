# BIM-TASK-0144 - Geolocalizacion BIM modelo-mapa

Estado: Cerrada localmente

## Objetivo

Incorporar una ubicacion de obra BIM versionada y un mapa operativo
sin leer ni escribir automaticamente la geolocalizacion de GiProy Clasico.

## Cambios

- Migracion aditiva `de2031a1b2c3` para anclas BIM por empresa/proyecto.
- Ancla WGS84 con CRS declarado, altitud, origen local, rumbo y zoom.
- Trazabilidad de `codigo_root` y revision clasica, manteniendo aislamiento
  operativo estricto por `proyecto_id`.
- Transformacion local ENU a WGS84 para los origenes de modelos federados.
- Revisiones inmutables con una unica georreferencia activa por proyecto.
- Herramienta `Ubicacion` en Coordinacion y Administracion BIM, con mapa
  Leaflet, ancla, modelos y seleccion sincronizada con la version del visor.

## Limites explicitos

- No se promete reproyeccion universal entre CRS; el topografo debe declarar
  el ancla WGS84 y el origen local certificados.
- No se inventan coordenadas por elemento IFC cuando el modelo no las aporta.
- No se comparte georreferencia entre revisiones de proyecto aunque tengan el
  mismo `codigo_root`.

## Validacion

- Suite focal de servicio y rutas: `3 passed`; regresion seleccionada BIM:
  `41 passed`.
- PostgreSQL real: upgrade/downgrade `de2031a1b2c3`, `TIMESTAMPTZ`, revision
  entera e indice activo parcial: OK.
- Build y Playwright 1920x1080: mapa no vacio, ancla y dos modelos, seleccion
  mapa-modelo, guardado r2, sin overflow ni errores: OK.
- Workspace V2 agregado, anti-BIM y baseline enterprise: OK.
- Matriz: C05 completa, `55,00%`.

## Rollback

Ejecutar downgrade `de2031a1b2c3` y retirar endpoints, servicio, cliente,
panel y harness. Federaciones, modelos y dominios clasicos permanecen intactos.
