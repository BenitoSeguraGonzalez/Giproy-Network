# BIM-TASK-0176 - Observabilidad operativa de colaboracion CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de telemetria desplegada
Modo: GIPROY BIM

## Objetivo

Extender la observabilidad BIM existente con indicadores sanitizados de salud
CDE para diagnosticar presencia, feed y retraso antes del rollout, sin exponer
datos de usuario, contexto de trabajo ni contenido de revisiones.

## Alcance ejecutado

- El contrato `giproy_bim_operational_metrics_v1` agrega sesiones totales,
  activas y expiradas por empresa/proyecto.
- El feed aporta conteo total, agrupacion por tipo, ultimo cursor, fecha del
  ultimo evento y retraso observado.
- Las agregaciones se ejecutan en base de datos y no serializan nombres,
  `context_json`, `payload_json`, resumen ni contenido documental.
- Se reutiliza el endpoint administrativo BIM existente; no se abre una ruta ni
  una dependencia nueva desde GiProy Clasico.

## Validacion

- `py_compile`: correcto.
- Tests focales de metricas y colaboracion: 6 correctos.
- Tenant, expiracion, cursor y sanitizacion verificados.
- El warning Pydantic `model_*` permanece conocido y no bloqueante.

## No interferencia clasica

El cambio solo amplía un contrato administrativo BIM protegido por
`bim.admin`. No modifica API, UX, modelos, tablas ni datos clasicos.

## Limite declarado

La telemetria local queda disponible. H03 permanece parcial hasta recoger estas
metricas en servidor durante concurrencia y reconexion reales.

## Rollback

Retirar la seccion `collaboration` del servicio de metricas y su prueba. El
contrato previo permanece compatible porque la ampliacion es aditiva.

## Resultado

Paridad: 88,33%. Programa: 50/61 slices, 81,97% realizado y 18,03% pendiente.
