# BIM-TASK-0046 - Simulacion IFC/fragments de volumen local

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Validar que el pipeline IFC -> fragments no queda limitado a un unico elemento
geometrico y puede generar un artefacto binario mayor desde una simulacion de
volumen controlada.

## Alcance

- Agregar builder IFC local para generar multiples muros geometricos.
- Agregar smoke Node con `IfcImporter` real de `@thatopen/fragments`.
- Comparar el fragments de volumen contra el fixture base.
- Proteger el nuevo smoke desde `smoke-bim-workspace-positive.mjs`.

## Cambios realizados

- `frontend/src/components/bim/bimFragmentsVolumeIfc.js` genera IFC sintetico
  con 25 muros, placements propios y relacion espacial.
- `frontend/scripts/smoke-bim-fragments-volume.mjs` procesa el IFC con
  `IfcImporter`, escribe `frontend/tmp/bim-fragments-smoke/volume-smoke.frag`
  y valida que el binario supere al fixture base.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` exige builder y smoke de
  volumen dentro del cierre BIM.

## No alcance

- No incorpora dataset real de obra.
- No mide rendimiento de modelos grandes.
- No reemplaza el viewer actual por renderer fragments maduro.
- No activa UX BIM visible en modulos clasicos.

## Validacion

- `cmd /c node scripts\smoke-bim-fragments-volume.mjs` desde `frontend`: OK,
  25 walls, 2460 bytes.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

## Rollback

Revertir:

- `frontend/src/components/bim/bimFragmentsVolumeIfc.js`
- `frontend/scripts/smoke-bim-fragments-volume.mjs`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`
- esta TASK y sus referencias documentales

El rollback no requiere migraciones ni cambios de base de datos.

## Pendiente posterior

- Dataset real autorizado o fixture representativo de mayor fidelidad.
- Renderer fragments maduro o puente visual avanzado.
- Pruebas de rendimiento y memoria con volumen realista.
