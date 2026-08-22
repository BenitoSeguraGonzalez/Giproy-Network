# BIM-TASK-0194 - Adaptador Leaflet permisivo para mapas BIM

Fecha: 2026-08-11

Estado: CERRADA EN CANDIDATA LOCAL

Relacionado: TASK-2046

## Objetivo

Retirar `react-leaflet` y `@react-leaflet/core` del artefacto distribuido por su
licencia Hippocratic-2.1, preservando el mapa BIM mediante un adaptador React
local sobre Leaflet BSD-2-Clause.

## Criterios

- [x] Catálogo XYZ/WMS, opacidad, puntos, tooltips y selección conservados.
- [x] Atribución OpenStreetMap completa y enlazada.
- [x] Las dependencias Hippocratic desaparecen del lock y bundle.
- [x] Build, smoke BIM y smoke anti-contaminación Classic correctos.

## Evidencia

- `npm audit --omit=dev`: 0 vulnerabilidades runtime.
- Build Vite: 2.508 módulos transformados.
- `validate-bim-site-georeference-dom`: correcto en 1920x900 y 2560x1300.
- `smoke-classic-no-bim-contamination`: correcto.
- `smoke-classic-datos-proyecto-logging-boundary`: correcto.
- Inspección visual del mapa y atribución: correcta.

## Rollback

Restaurar imports y dependencias React Leaflet anteriores. No hay cambios de
API, esquema ni datos BIM.
