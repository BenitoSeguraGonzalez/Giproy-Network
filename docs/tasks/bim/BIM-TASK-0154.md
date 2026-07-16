# BIM-TASK-0154 - Estimacion BIM gobernada desde QTO aprobado

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F01 con estimaciones BIM versionadas y aprobables derivadas de QTO
aprobado, sin escribir Presupuestos clasico.

## Alcance ejecutado

- Migracion aditiva `de2038a1b2c3` para `bim_cost_estimates` con subtotal
  `NUMERIC`, lineas reproducibles y checksum del QTO fuente.
- Precio unitario obligatorio para cada fila QTO, calculo monetario decimal y
  revision unica por tenant/proyecto.
- Workflow borrador, aprobado, rechazado y sustituido con lock optimista y una
  sola estimacion aprobada activa.
- Endpoints BIM protegidos y herramienta `Estimacion` en Produccion V2.
- Sin lectura o escritura en presupuestos, APUs, contratos o contabilidad
  clasicos.

## Validacion

- `py_compile` y 2 tests focales: correctos.
- PostgreSQL reversible `de2010 -> de2038 -> de2010 -> de2038`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 21 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Estimacion` y revertir
`de2038a1b2c3`; no se afecta ninguna tabla clasica.

## Resultado

F01 queda completa. Paridad SYNCHRO: 65,83% (35 completas, 9 parciales y 16
ausentes). Programa: 28/61 slices, 45,90% realizado y 54,10% pendiente. Sin
deploy.
