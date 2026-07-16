# BIM-TASK-0089 - Observabilidad operativa

Estado: Cerrada localmente

## Implementacion

- Cada import job expone `correlation_id` estable `bim-job-{id}`.
- Metricas tenant/proyecto agregan estados, etapas, codigos de fallo, duracion,
  bytes de entrada y artifacts sin nombres, rutas, propiedades ni mensajes.
- Endpoint administrativo y cliente BIM de dominio permiten diagnostico bajo
  capacidad `bim.admin`.

## Validacion

- Prueba de sanitizacion confirma ausencia de nombre de modelo, archivo, ruta y
  detalle privado.
- Correlation id enlaza job y metadata de artifact fuente.
- Suite BIM acumulada y baseline enterprise: OK.

## Rollback

Retirar agregador/endpoint/campos de respuesta. No existe escritura clasica.
