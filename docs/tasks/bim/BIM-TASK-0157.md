# BIM-TASK-0157 - Schedule of Values BIM gobernado

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F04 con un Schedule of Values versionado y conciliado con contratos
BIM activos, sin reutilizar EDT, APUs o Presupuesto clasico.

## Alcance ejecutado

- Migracion aditiva `de2041a1b2c3` para
  `bim_cost_schedules_of_values`, con lineas JSON reproducibles y total
  `NUMERIC`.
- Lineas con codigo unico, descripcion y valor programado positivo; su suma
  debe coincidir exactamente con el compromiso contractual.
- Revisiones unicas por contrato, workflow borrador/aprobado/rechazado/
  sustituido, lock optimista y una sola aprobada activa.
- Endpoints BIM protegidos y editor `Valores` en Produccion V2 con suma y
  diferencia contractual visibles.
- Sin lectura o escritura sobre EDT, APUs, Presupuestos o contratos clasicos.

## Validacion

- `py_compile` y 3 tests focales SOV: correctos.
- PostgreSQL reversible `de2010 -> de2041 -> de2010 -> de2041`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 24 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Valores` y revertir `de2041a1b2c3`; no
se afecta ninguna tabla clasica.

## Resultado

F04 queda completa. Paridad SYNCHRO: 70,83% (38 completas, 9 parciales y 13
ausentes). Programa: 31/61 slices, 50,82% realizado y 49,18% pendiente. Sin
deploy.
