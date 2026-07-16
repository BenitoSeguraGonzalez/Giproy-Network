# BIM-TASK-0106 - Playback 4D profesional nativo

Estado: Cerrada y validada

## Objetivo

Agregar play, pausa, velocidad, scrubber, fecha de corte y foco de actividad
sobre timeline/Fragments propios, sin servicios externos.

## Gate

Secuencia reproducible, reversible y validada desktop/movil sobre datos BIM.

## Resultado

- Playback con play/pausa, paso anterior/siguiente, velocidades 0.5x-4x y scrubber.
- Foco por `GlobalId` sincronizado con el viewer BIM.
- Protección contra respuestas temporales obsoletas y fin de rango controlado.
- Validación: build Vite y `validate-bim-timeline-4d-dom.mjs` desktop/móvil.
