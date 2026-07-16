# BIM-TASK-0149 - Diario de obra consolidado de Campo

Estado: Cerrada localmente

## Objetivo

Consolidar observaciones, avance, recursos, costes y evidencia de los partes
4D existentes en una experiencia diaria de Campo, sin duplicar actividades,
progreso ni fuentes de verdad clasicas.

## Cambios

- Tab `Diario` como primera herramienta de Campo BIM V2.
- Agrupacion por fecha con busqueda, frente de trabajo y rango temporal.
- Resumen diario de partes, evidencias, horas de mano de obra, horas de equipo
  y coste real.
- Lista y detalle del parte con actividad, frente, avance, cantidad instalada,
  SPI/CPI, observacion oficial y galeria de evidencia descargable.
- Cliente y persistencia existentes de partes 4D reutilizados sin endpoints,
  tablas ni migraciones nuevas.
- Harness y smoke interactivo en `1920x900` y `2560x1300`.

## Criterios verificados

- `daily_log` permanece como observacion oficial y el parte 4D como registro
  operativo unico.
- La evidencia conserva el contrato binario PostgreSQL existente y se descarga
  mediante el cliente BIM de dominio.
- Las cantidades instaladas se muestran por parte y unidad; no se suman entre
  unidades incompatibles en el resumen diario.
- Filtros, seleccion y descarga operan sin alterar el registro de avance.
- No se agrega PWA, cache, sincronizacion offline ni soporte movil.

## Validacion

- Build Vite y 16 smokes Workspace BIM V2 encadenados: OK.
- Pruebas focales PostgreSQL de partes, incidencias y BCF: `8 passed`.
- Validador PostgreSQL reversible hasta `de2033a1b2c3`: OK.
- Playwright `1920x900` y `2560x1300`: OK; sin overflow, solapamientos ni
  errores de consola.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: D05 y E05 completas, `60,83%`.

## Rollback

Retirar tab, panel, harness y smoke. No existe migracion ni dato nuevo que
revertir; partes, evidencia, GiProy Clasico y TASK-1807 permanecen intactos.
