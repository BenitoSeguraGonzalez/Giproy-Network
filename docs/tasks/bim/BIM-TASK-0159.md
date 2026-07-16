# BIM-TASK-0159 - Ledger de coste real desde Campo BIM

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F06 con coste real gobernado desde partes de Campo, sin consultar ni
modificar nomina, inventario, Presupuestos o contabilidad de GiProy Clasico.

## Alcance ejecutado

- Migracion aditiva `de2043a1b2c3` para `bim_cost_actual_entries` y moneda
  explicita en partes BIM existentes, con USD como compatibilidad inicial.
- Un asiento inmutable por parte, con coste acumulado e incremento respecto al
  parte anterior de la actividad, segregado por empresa y proyecto.
- Publicacion automatica para partes nuevos y conciliacion historica
  idempotente para partes anteriores a la migracion.
- Bloqueo de costes acumulados decrecientes y de cambios de moneda dentro de
  una misma serie de actividad.
- Eventos no planificados validados expuestos como excepciones fuera del total,
  evitando sumarlos dos veces cuando ya forman parte del coste declarado.
- Endpoints BIM protegidos y herramienta `Reales` en Produccion V2.

## Validacion

- `py_compile` y 4 tests focales de ledger/partes: correctos.
- PostgreSQL reversible `de2010 -> de2043 -> de2010 -> de2043`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 26 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Reales`, exportar los asientos si se
requiere conservarlos y revertir `de2043a1b2c3`. El downgrade elimina solo el
ledger y la moneda agregada a partes BIM; no afecta tablas clasicas.

## Resultado

F06 queda completa. Paridad SYNCHRO: 73,33% (40 completas, 8 parciales y 12
ausentes). Programa: 33/61 slices, 54,10% realizado y 45,90% pendiente. Sin
deploy.
