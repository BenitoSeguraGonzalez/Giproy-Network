# BIM-TASK-0152 - Materiales y equipos de Campo

Estado: Cerrada localmente

## Objetivo

Completar el ciclo operativo Perform de recepcion, consumo y retorno de
materiales y equipos BIM en Campo, sin escribir inventario, compras,
contabilidad, APUs ni otros dominios de GiProy Clasico.

## Cambios

- Migracion aditiva `de2036a1b2c3` con libro de movimientos tenant-aware sobre
  el catalogo `Bim4dResource` existente.
- Movimientos inmutables `receipt`, `consume` y `return`, vinculables a
  actividad snapshot y frente BIM.
- Saldo calculado por recurso y bloqueo transaccional que impide consumos con
  resultado negativo.
- Nueva tab `Materiales` en Campo con recursos, alta contextual y libro de
  movimientos.
- Harness y smoke interactivo en `1920x900` y `2560x1300`.

## Criterios verificados

- Recurso, actividad, frente y movimiento respetan empresa y proyecto.
- Campo solo admite recursos BIM de tipo material o equipo; el consumo exige
  actividad y nunca puede superar el saldo disponible.
- Los movimientos no mutan fuentes clasicas ni se presentan como integracion
  ERP, contable o de compras.
- No se agrega PWA, cache, sincronizacion offline ni soporte movil.

## Validacion

- Compilacion Python y build Vite: OK.
- Regresion PostgreSQL de Campo y Perform: `14 passed`.
- Alembic PostgreSQL `de2010 -> de2036 -> de2010 -> de2036`: OK;
  `TIMESTAMPTZ` verificado.
- 19 smokes Workspace BIM V2 encadenados: OK.
- Playwright `1920x900` y `2560x1300`: OK; sin overflow, solapamientos ni
  errores de consola.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: E07 completa, `63,33%`.

## Rollback

Retirar endpoints, modelo, schemas, servicio, cliente, UX, harness y smoke;
ejecutar downgrade `de2036a1b2c3 -> de2035a1b2c3`. Se elimina solo el libro de
movimientos BIM, sin tocar recursos anteriores, GiProy Clasico ni TASK-1807.
