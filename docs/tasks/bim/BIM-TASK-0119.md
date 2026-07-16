# BIM-TASK-0119 - Persistencia versionada de artefactos CSG

Estado: cerrada localmente.

## Objetivo

Persistir resultados CSG exactos como artefactos BIM inmutables, versionados y
tenant-aware en PostgreSQL, conservando intacta la fuente BIM y el artefacto
parametrico legado `bounding_box_v1`.

## Implementacion

- Migracion aditiva `de2022a1b2c3` para
  `bim_4d_partition_csg_artifacts`.
- Contrato `giproy_bim_4d_csg_artifact_v1` con posiciones, normales, indices,
  volumen, triangulos, segmentos, revision y checksum.
- El backend recalcula volumen desde la triangulacion, valida indices, valores
  finitos, conteos, GlobalId, segmentos consecutivos y conservacion volumetrica.
- POST y GET protegidos por capacidades BIM y frontera de empresa/proyecto.
- Cliente de dominio y harness verifican persistencia/lectura por SHA-256.

## Validacion

- `7 passed` en `test_bim_4d_partitions.py`, incluido round-trip HTTP.
- Suite BIM completa: `120 passed`.
- `validate_bim_postgresql.py`: upgrade/downgrade/re-upgrade OK.
- PostgreSQL operativo: `de2022a1b2c3`.
- Harness CSG desktop/mobile, smoke BIM positivo, smoke anti-BIM y baseline
  enterprise: OK.

## Limites

El contrato ya admite mallas exactas, pero esta TASK se valida con geometria
manifold controlada. La certificacion sobre geometria extraida de IFC/Fragments
real corresponde al siguiente gate.

## Rollback

Downgrade puntual `de2022a1b2c3 -> de2021a1b2c3`, retirada de endpoints y
cliente CSG. No modifica tablas clasicas ni el artefacto de particion anterior.
