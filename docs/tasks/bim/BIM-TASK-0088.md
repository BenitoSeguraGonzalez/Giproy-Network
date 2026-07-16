# BIM-TASK-0088 - Rendimiento y estabilidad

Estado: Cerrada localmente para la matriz reproducible disponible

## Implementacion

- Presupuesto automatizado de first render menor a 8 s, FPS minimo 20,
  crecimiento de heap menor a 75% y cero errores de pagina.
- Tres ciclos reales de mount/unmount verifican disposal de canvas, renderer,
  controles y Fragments.
- Matriz Chrome/Edge en desktop 1280x820 y tablet 820x1180.
- Cancelacion de jobs y recuperacion de contexto WebGL permanecen operativas.

## Validacion 2026-07-11

- Chrome desktop/tablet: 60 FPS, first render maximo 848 ms.
- Edge desktop/tablet: 60 FPS, first render maximo 844 ms.
- Memoria final aproximada 32.4-32.5 MB y sin canvas residual.
- Corpus IFC S/M/L se valida por los smokes Gate A; estas cifras de viewer
  corresponden al fixture federado reproducible y no certifican hardware ajeno.

## Rollback

Retirar el smoke de presupuesto; no modifica datos ni GiProy Clasico.
