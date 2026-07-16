# BIM-TASK-0115 - Equipos y trayectorias temporales 4D

Estado: Cerrada y validada

## Objetivo

Modelar equipos, zonas de operacion, trayectorias y geometria temporal ligada a
actividades para simulacion, conflictos y playback.

## Resultado

- Equipos BIM y planes de movimiento tenant-aware persistidos en PostgreSQL
  `de2020a1b2c3`, sin depender del modulo Equipo clasico.
- Trayectorias temporizadas ligadas a snapshots de actividad 4D, con
  interpolacion reproducible de posicion.
- Geometria temporal y radio operacional visibles en WebGL.
- Conflictos calculados por solape temporal y distancia entre rutas/zonas.
- Es simulacion planificada; no se declara GPS, telemetria ni fisica dinamica.

## Validacion

- `115 passed` en la suite BIM.
- PostgreSQL reversible `de2020a1b2c3 -> de2019a1b2c3`.
- Build, smoke BIM, anti-BIM y baseline enterprise en verde.
- Harness WebGL desktop/mobile valida playback al 50%, conflicto, canvas no
  vacio y ausencia de overflow.
