# BIM-TASK-0158 - Ordenes de cambio BIM gobernadas

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F05 con potenciales ordenes y ordenes de cambio gobernadas sobre
contratos BIM, sin alterar contratos, cronogramas o finanzas de GiProy Clasico.

## Alcance ejecutado

- Migracion aditiva `de2042a1b2c3` para `bim_cost_change_orders`, aislada por
  empresa, proyecto y contrato BIM.
- Workflow potencial/enviado/aprobado/rechazado/cancelado con lock optimista,
  autor, motivos e impactos solicitados y aprobados de coste y plazo.
- La aprobacion actualiza el compromiso contractual en una transaccion,
  sustituye el SOV aprobado y bloquea reducciones inferiores a pagos reservados.
- Endpoints BIM protegidos y herramienta `Cambios` en Produccion V2.
- Sin lectura o escritura sobre contratos, EDT, APUs, Presupuestos,
  Cronogramas, facturacion o contabilidad clasicos.

## Validacion

- `py_compile` y 3 tests focales de ordenes de cambio: correctos.
- PostgreSQL reversible `de2010 -> de2042 -> de2010 -> de2042`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 25 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Cambios` y revertir `de2042a1b2c3`; no
se afecta ninguna tabla clasica. Antes del downgrade deben conservarse o
exportarse las PCO creadas si se requiere trazabilidad historica.

## Resultado

F05 queda completa. Paridad SYNCHRO: 72,50% (39 completas, 9 parciales y 12
ausentes). Programa: 32/61 slices, 52,46% realizado y 47,54% pendiente. Sin
deploy.
