# BIM-TASK-0156 - Solicitudes y certificaciones de pago BIM

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar F03 con solicitudes y certificaciones de pago contra contratos BIM
activos, sin ejecutar pagos ni escribir tesoreria o contabilidad clasicas.

## Alcance ejecutado

- Migracion aditiva `de2040a1b2c3` para
  `bim_cost_payment_applications`, con importes `NUMERIC`, periodo y
  trazabilidad tenant/proyecto/contrato.
- Bruto, retencion y neto solicitado; el acumulado no rechazado se limita al
  compromiso contractual.
- Workflow borrador, enviado, certificado y rechazado con lock optimista,
  autores y timestamps de envio/decision.
- Bruto y retencion certificados limitados por la solicitud; el certificado
  acumulado no puede superar el compromiso del contrato.
- Endpoints BIM protegidos y herramienta `Pagos` en Produccion V2.
- Sin Schedule of Values, ordenes de cambio, pago efectivo ni acoplamiento a
  facturacion, tesoreria o contabilidad clasicas.

## Validacion

- `py_compile` y 3 tests focales de pago: correctos.
- PostgreSQL reversible `de2010 -> de2040 -> de2010 -> de2040`: correcto.
- Build Vite y Playwright 1920x900/2560x1300: correctos.
- 23 smokes BIM y baseline enterprise/anti-BIM: correctos.

## Rollback

Ocultar BIM, retirar la herramienta `Pagos` y revertir `de2040a1b2c3`; no se
afecta ninguna tabla clasica.

## Resultado

F03 queda completa. Paridad SYNCHRO: 69,17% (37 completas, 9 parciales y 14
ausentes). Programa: 30/61 slices, 49,18% realizado y 50,82% pendiente. Sin
deploy.
