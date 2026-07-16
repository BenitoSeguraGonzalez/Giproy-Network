# BIM-TASK-0151 - Eventos no planificados con impacto real

Estado: Cerrada localmente

## Objetivo

Completar la trazabilidad Perform de eventos no planificados con impacto real
de plazo y coste sobre snapshots de actividad BIM, sin reprogramar ni escribir
en Cronogramas o Presupuestos de GiProy Clasico.

## Cambios

- Migracion aditiva `de2035a1b2c3` con eventos tenant-aware ligados a proyecto,
  snapshot de actividad y frente opcional.
- Registro de tipo, ocurrencia, descripcion, dias de retraso y coste real.
- Decision gobernada y auditable desde `reported` hacia `validated` o `void`,
  sin segunda decision ni mutacion del origen clasico.
- Nueva tab `Eventos` en Produccion con lista, alta, detalle, totales validados
  y resolucion operativa.
- Harness y smoke interactivo en `1920x900` y `2560x1300`.

## Criterios verificados

- Actividad, frente y evento se resuelven siempre por empresa y proyecto.
- Los totales de impacto solo incluyen eventos validados; los anulados quedan
  auditados y no contribuyen a plazo o coste.
- No existe escritura, reprogramacion ni dependencia desde Cronogramas,
  Presupuestos u otros modulos clasicos.
- No se agrega PWA, cache, sincronizacion offline ni soporte movil.

## Validacion

- Compilacion Python y build Vite: OK.
- Regresion PostgreSQL de eventos, seguridad, partes e incidencias: `12 passed`.
- Alembic PostgreSQL `de2010 -> de2035 -> de2010 -> de2035`: OK;
  `TIMESTAMPTZ` verificado.
- 18 smokes Workspace BIM V2 encadenados: OK.
- Playwright `1920x900` y `2560x1300`: OK; sin overflow, solapamientos ni
  errores de consola.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: E04 completa, `62,50%`.

## Rollback

Retirar endpoints, servicio, schemas, cliente, UX, harness y smoke; ejecutar
downgrade `de2035a1b2c3 -> de2034a1b2c3`. La tabla de eventos se elimina sin
tocar datos 4D anteriores, GiProy Clasico ni TASK-1807.
