# BIM-TASK-0170 - Ensayo DR del dominio BIM

Fecha: 2026-07-17
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar H07 con un ensayo reproducible de backup y recuperación PostgreSQL
del dominio BIM, sin operar sobre la base productiva.

## Alcance ejecutado

- Validador `validate_bim_disaster_recovery.py` limitado a bases `_test`.
- Backup `pg_dump` data-only de todas las tablas `bim_*`.
- Restauración `pg_restore` sobre un esquema limpio equivalente.
- Comparación de conteos y SHA-256 por tabla antes y después.
- Fingerprint clásico antes/después y eliminación automática de ambas bases.

## Validación

- 2 pruebas unitarias de guardas y normalización: correctas.
- Ensayo PostgreSQL real: 79 tablas BIM, 2 filas recuperadas, checksum
  `86c98a641c0172299c1da899494030689ad26a371ed2caa6e43678178c33816f`.
- Contexto clásico inalterado y tiempo local medido de 17,165 segundos.
- Baseline enterprise y anti-BIM: correctos.

## No interferencia clásica

El dump selecciona únicamente `bim_*`. Las tablas `empresas`, `proyectos` y
`usuarios` se usan como contexto preexistente y su fingerprint debe permanecer
idéntico. No se integra con el servicio de backup clásico.

## Rollback

El validador elimina las dos bases `_test` y su archivo temporal incluso ante
fallo. Retirar el script y su prueba no altera persistencia ni runtime.

## Resultado

H07 queda completa. Paridad: 82,50%. Programa: 44/61 slices, 72,13% realizado
y 27,87% pendiente. Sin deploy.
