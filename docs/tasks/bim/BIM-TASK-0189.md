# BIM-TASK-0189 - Resolucion fisica compatible en workspace BIM

Fecha: 2026-07-22
Estado: Cerrada localmente
Modo: GIPROY BIM
Integracion controlada: `TASK-2035`

## Objetivo

Corregir el falso bloqueo del workspace BIM en pantallas de `1920 x 1080` o
superiores cuando el sistema operativo presenta sus dimensiones en pixeles CSS.

## Alcance ejecutado

- Detector comun de resolucion fisica estimada mediante dimensiones de pantalla
  y `devicePixelRatio`.
- Guarda BIM y aviso general alineados con el mismo umbral.
- Escenario Playwright de pantalla 1920x1080 con escalado 125%.
- Conservacion del bloqueo para una pantalla fisica 1600x900.

## No interferencia clasica

La integracion clasica se limita a corregir el origen de la medicion del aviso.
No se modifican flujos, contratos, datos ni superficies visibles cuando la
resolucion ya era compatible. La feature BIM y su allowlist no cambian.

## Validacion local

- Smoke focal: correcto.
- Playwright BIM: correcto, sin bloqueo falso ni overflow.
- Build Vite: correcto.
- Baseline enterprise y smoke anti-BIM: correctos.

## Rollback

Revertir `BIM-TASK-0189` y `TASK-2035`. No hay migraciones ni persistencia.

## Porcentaje

Slice BIM-TASK-0189: 100% local. Implementacion tecnica autorizada: 61/61,
100%. Liberacion general: 60/61, 98,36%; los gates externos no cambian.
