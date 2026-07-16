# BIM-TASK-0114 - Materializacion geometrica constructiva

Estado: Cerrada y validada

## Objetivo

Generar particiones geometricas consultables con volumen/area verificables,
artefacto versionado y trazabilidad bidireccional al elemento fuente.

## Resultado

- Artefacto inmutable `giproy_bim_4d_partition_artifact_v1` persistido en
  PostgreSQL mediante `de2019a1b2c3`.
- Segmentos fisicos parametricos `bounding_box_v1` con limites 3D, volumen,
  superficie, checksum y trazabilidad a `element_id`/`GlobalId`.
- Materializacion idempotente y render WebGL desde el artefacto real.
- La fuente IFC permanece intacta y `exact_ifc_csg=false`; no se declara corte
  booleano exacto de la malla IFC.

## Validacion

- `113 passed` en la suite BIM.
- PostgreSQL reversible `de2019a1b2c3 -> de2018a1b2c3`.
- Build frontend, smoke BIM, smoke anti-BIM y baseline enterprise en verde.
- Harness WebGL desktop/mobile valida materializacion, volumen, metodo y canvas
  no vacio sin overflow.
