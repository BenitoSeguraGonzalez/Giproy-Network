# BIM-TASK-0175 - Resiliencia concurrente de colaboracion CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de repeticion desplegada
Modo: GIPROY BIM

## Objetivo

Certificar que la presencia y el feed incremental de `BIM-TASK-0174` soportan
heartbeats concurrentes, expiracion y reconexion sin duplicar sesiones ni
eventos, usando PostgreSQL real y sin modificar GiProy Clasico.

## Alcance ejecutado

- La creacion de presencia usa un savepoint y recupera la fila ganadora cuando
  dos transacciones compiten por la misma clave de sesion.
- La reconexion de una sesion expirada conserva su identidad y no duplica
  `presence.joined`.
- Se incorpora un ensayo reproducible sobre una base dedicada `_test`, con 12
  conexiones concurrentes, dos usuarios, expiracion, reconexion y cursor delta.
- El ensayo elimina sus datos temporales y nunca apunta a la base operativa.

## Validacion

- `py_compile`: correcto.
- Tests focales CDE/revisiones: 7 correctos.
- PostgreSQL `de2057` con downgrade completo y re-upgrade: correcto.
- Ensayo concurrente: 12 workers, una presencia compartida, dos sesiones
  activas, dos eventos de union, un delta posterior y reconexion correcta.

## No interferencia clasica

El cambio vive exclusivamente en el servicio y tooling BIM. No modifica rutas,
modelos, contratos, pantallas ni datos de GiProy Clasico, y no requiere una
nueva migracion.

## Limite declarado

La evidencia local de concurrencia y reconexion queda completa. H03 permanece
parcial hasta repetir el ensayo contra el servidor desplegado, con red real,
observabilidad y al menos dos sesiones humanas autorizadas.

## Rollback

Revertir el manejo de colision del heartbeat, la prueba focal y el validador.
La migracion y los contratos de `BIM-TASK-0174` permanecen compatibles.

## Resultado

Paridad: 88,33%. Programa: 49/61 slices, 80,33% realizado y 19,67% pendiente.
