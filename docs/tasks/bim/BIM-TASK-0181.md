# BIM-TASK-0181 - Despliegue beta y certificacion remota CDE

Fecha: 2026-07-20
Estado: Cerrada en beta controlada
Modo: GIPROY BIM

## Objetivo

Desplegar de forma reversible la ola `BIM-TASK-0173` a `0180` en el servidor
beta autorizado y completar H03 con evidencia de dos sesiones concurrentes
sobre HTTPS y red real, sin alterar GiProy Clasico ni ampliar la allowlist.

## Alcance ejecutado

- Se respaldo PostgreSQL, fuentes sustituidas y las imagenes backend/frontend
  previas al despliegue.
- Se reconstruyeron las imagenes beta y se aplicaron las migraciones aditivas
  `de2056` y `de2057`; Alembic queda en `de2057a1b2c3 (head)`.
- El frontend desplegado contiene la UX ERP de `BIM-TASK-0172`, Actividad CDE
  y el contrato `has_more` de drenaje multipagina.
- La allowlist permanece limitada a empresas `1,3`.
- El probe remoto declara un `User-Agent` tecnico para atravesar el WAF sin
  relajar seguridad, redirects ni manejo de credenciales.
- Dos identidades efimeras de certificacion ejecutaron heartbeat concurrente,
  cursor incremental, expiracion, reconexion y metricas. Tokens y sesiones se
  mantuvieron en memoria y todo dato temporal fue eliminado al finalizar.

## Evidencia

- `BIM_CDE_REMOTE_OK company=1 project=22 initial_sessions=2
  expired_sessions=1 reconnected_sessions=2 delta_events=1 latest_cursor=4
  metrics_active=2`.
- Cleanup verificado: 0 usuarios, 0 presencias y 0 eventos de certificacion.
- Prueba focal del probe: 5 correctas.
- Home publica: HTTP 200; endpoints CDE y gateway sin autenticar: HTTP 401.
- Tabla e indice CDE verificados en PostgreSQL:
  `(empresa_id, proyecto_id, id)`.
- Imagenes activas:
  - backend `sha256:ebacf97fe0d547c0df831dc53fb5f2a2061ee18186d2fa9c85ca1188c6ca2f37`;
  - frontend `sha256:a5dce3382e224396ae1add686de81f7fb7401d48756b84b722a39f8aa362a5b2`.

## No interferencia clasica

No se modificaron contratos clasicos, auth, tenant, EDT, APUs, Presupuesto,
Cronogramas ni datos clasicos. La UX sigue bajo feature flag, licencia y
allowlist; el baseline TASK-1807 no fue tocado.

## Rollback

- Backup:
  `/home/benito/docker/apps/giproy-beta/deploy/backups/bim-wave-0173-0180-20260720-155509`.
- Imagenes previas:
  `giproy-beta-backend:bim-wave-0173-0180-predeploy-20260720-155509` y
  `giproy-beta-frontend:bim-wave-0173-0180-predeploy-20260720-155509`.
- Restaurar imagenes y fuentes respaldadas; si se requiere rollback de datos,
  restaurar `giproy-beta-20260720-155527.sql.gz`.

## Limite declarado

H03 queda completa tecnicamente. Esto no sustituye Gate E: siguen pendientes
diez jornadas habiles, dos revisiones reales y aceptacion de usuarios humanos.
Tampoco sustituye Gate K ni convierte la paridad total en 100%.

## Porcentaje

Paridad: 89,17%, 52 completas, 3 parciales y 5 ausentes. Programa: 55/61
slices, 90,16% realizado y 9,84% pendiente.
