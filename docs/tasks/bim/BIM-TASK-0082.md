# BIM-TASK-0082 - IDS y reglas de informacion

Estado: Cerrada localmente

## Implementacion

- Migracion Alembic aditiva `de2006a1b2c3` para perfiles, ejecuciones y
  hallazgos IDS, aislados por empresa/proyecto/version.
- Parser IDS XML compatible con applicability de entidad y requirements de
  entidad/propiedad, incluidos Pset, nombre, valor y severidad.
- Contrato `giproy_bim_ids_validation_v1` con resultado por requisito y GUID.
- Excepciones solo sobre fallos, con motivo, usuario y fecha auditables.
- Exportacion CSV reproducible de hallazgos y excepciones.
- Panel BIM compacto para importar `.ids`, ejecutar sobre la version activa,
  enfocar GUID, registrar excepcion y exportar.

## Validacion

- Fixture IDS namespaced compatible con IDS 1.0: OK.
- Un muro conforme, uno fallido y un elemento fuera de aplicabilidad: OK.
- Excepcion auditada y CSV: OK.
- Perfil/version fuera del tenant: 404.
- Migracion upgrade/downgrade: OK.
- Suite BIM acumulada: `86 passed`.
- Harness UI IDS, build, smoke BIM, anti-BIM y fronteras API: OK.

## No interferencia clasica

No se modifican validaciones IFC existentes, auth, roles, datos ni contratos
clasicos. IDS evalua copias BIM persistidas y nunca escribe en GiProy Clasico.

## Rollback

Retirar panel, cliente, endpoints, servicio y modelos; ejecutar downgrade
`de2006a1b2c3` solo con autorizacion de base de datos.
