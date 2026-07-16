# BIM-TASK-0155 - Contratos BIM de coste gobernados

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F02 con contratos BIM de coste derivados de una estimacion aprobada,
sin depender de compras, proveedores, contratos o contabilidad clasicos.

## Alcance ejecutado

- Migracion aditiva `de2039a1b2c3` para `bim_cost_contracts`, con importe
  `NUMERIC`, periodo contractual, tenant/proyecto y numero unico.
- Estimacion BIM aprobada como unica fuente economica; moneda heredada y
  compromiso acumulado no cancelado limitado al subtotal aprobado.
- Workflow borrador, activo, cerrado y cancelado con lock optimista y motivo
  obligatorio en cada transicion.
- Endpoints BIM protegidos y herramienta `Contratos` en Produccion V2.
- La contraparte es un dato BIM aislado; no existe FK ni escritura sobre
  proveedores, compras, contratos, Presupuestos o contabilidad clasicos.

## Validacion

- `py_compile` y 3 tests focales: correctos.
- PostgreSQL reversible `de2010 -> de2039 -> de2010 -> de2039`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 22 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Contratos` y revertir
`de2039a1b2c3`; no se afecta ninguna tabla clasica.

## Resultado

F02 queda completa. Paridad SYNCHRO: 67,50% (36 completas, 9 parciales y 15
ausentes). Programa: 29/61 slices, 47,54% realizado y 52,46% pendiente. Sin
deploy.
