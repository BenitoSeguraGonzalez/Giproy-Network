# BIM-TASK-0116 - Seguridad y riesgos BIM 4D

Estado: Cerrada y validada

## Objetivo

Vincular riesgos, controles, inspecciones y zonas de exclusion a elementos,
frentes y ventanas temporales con evidencia y severidad reproducibles.

## Resultado

- Riesgos BIM 4D con actividad, elemento/frente opcional, ventana temporal,
  severidad, probabilidad, controles y zona de exclusion 3D.
- Inspecciones inmutables con resultado, nota y referencia de evidencia.
- Exposicion de trayectorias de equipo evaluada contra ventana y radio de zona.
- Panel WebGL con semaforo por score, controles y exposiciones reales.

## Validacion

- `117 passed` en la suite BIM.
- PostgreSQL reversible `de2021a1b2c3 -> de2020a1b2c3`.
- Build, harness WebGL desktop/mobile, smokes BIM/anti-BIM y baseline enterprise
  en verde.
