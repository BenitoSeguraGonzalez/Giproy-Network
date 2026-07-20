# BIM-TASK-0173 - Gateway de integracion empresarial BIM

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de certificacion beta
Modo: GIPROY BIM

## Objetivo

Completar B06 con API y webhooks reales para conectores externos, reutilizando
el contrato ERP H06 y sin introducir dependencias desde GiProy Clasico.

## Alcance ejecutado

- Migracion aditiva `de2056a1b2c3` para suscripciones y outbox tenant-aware.
- Destinos HTTPS publicos con resolucion DNS en alta y entrega; redes privadas,
  reservadas, credenciales, redirects y fragmentos quedan bloqueados.
- Secreto generado por el servidor, visible una sola vez y cifrado en reposo
  con clave derivada del secreto de aplicacion.
- Evento idempotente `erp.package.published`, payload minimo checksum-exacto y
  firma `HMAC-SHA256` en cada entrega.
- Entrega automatica post-commit, reintentos exponenciales, estados auditables y
  recuperacion manual desde el outbox.
- UI `Integraciones` dentro de Produccion para administrar conectores y
  supervisar/reintentar entregas.

## Validacion

- `py_compile` y 6 tests focales H06/B06: correctos.
- Build y smoke DOM en `1920x900` y `2560x1300`: correctos.
- PostgreSQL reversible, 34 smokes BIM, anti-BIM y baseline enterprise:
  correctos.
- Ensayo DR: 83 tablas BIM restauradas checksum-exacto y dominio clasico
  inalterado.

## No interferencia clasica

El evento nace al publicar un paquete `bim_erp_exchange_packages`; suscripciones
y entregas persisten solo en tablas `bim_*`. No cambia contratos, datos ni UX de
Cronogramas, APUs, Presupuesto, personal o contabilidad clasicos.

## Rollback

Desactivar las suscripciones o la puerta BIM, retirar panel/endpoints/servicio y
revertir `de2056a1b2c3`. Los paquetes ERP H06 y las tablas clasicas permanecen
intactos.

## Resultado

B06 queda completa. Paridad: 87,50%. Programa: 47/61 slices, 77,05% realizado y
22,95% pendiente.
