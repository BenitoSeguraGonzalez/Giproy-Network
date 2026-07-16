# BIM-TASK-0087 - Seguridad y auditoria BIM

Estado: Cerrada localmente

## Implementacion

- Capacidades componibles `bim.view`, `bim.review`, `bim.coordinate`,
  `bim.publish` y `bim.admin` por usuario y empresa.
- Grants aditivos tenant-aware y superadministrador con matriz completa.
- Operaciones sensibles de federacion, IDS, incidencias, cantidades,
  observabilidad y rollout protegidas por capacidad.
- Cambios de grants y rollout generan eventos de auditoria sin payload sensible.
- Migracion aditiva `de2009a1b2c3`; no cambia auth, JWT ni permisos clasicos.

## Validacion

- Pruebas positivas, negativas y cruce de empresa: OK.
- Suite BIM acumulada: `95 passed`.
- Baseline enterprise con frontend: OK.

## Rollback

Retirar endpoints/servicio/modelo BIM y revertir `de2009a1b2c3`. La matriz
clasica permanece intacta.
