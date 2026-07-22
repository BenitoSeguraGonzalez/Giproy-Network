# BIM-TASK-0189 - Resolucion fisica compatible en workspace BIM

Fecha: 2026-07-22
Estado: Cerrada en beta
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
En beta existe backup de fuentes
`deploy/backups/display-resolution-20260722-141704` e imagen previa
`giproy-beta-frontend:display-resolution-predeploy-20260722-141704`.

## Despliegue beta

- Frontend `sha256:e78318391aff115d0a0c5678cb78dcb7172ce72e651173e0bb987aa1e6ccbdb6` healthy.
- Backend y PostgreSQL permanecen healthy y sin recrear.
- Home HTTPS `200`; ruta BIM protegida mantiene `401` sin autenticacion.
- Bundle remoto con aviso nuevo y sin la redaccion antigua.

## Porcentaje

Slice BIM-TASK-0189: 100% en beta. Implementacion tecnica autorizada: 61/61,
100%. Liberacion general: 60/61, 98,36%; los gates externos no cambian.
