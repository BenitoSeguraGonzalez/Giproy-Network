# BIM-TASK-0118 - CSG exacto aislado y conservacion geometrica

Estado: cerrada localmente.

## Objetivo

Demostrar particion geometrica real mediante operaciones CSG sobre una malla
cerrada no trivial, dentro de un harness BIM aislado y sin modificar la fuente
IFC, contratos clasicos ni persistencia operativa.

## Criterios verificables

- La geometria fuente debe incluir una sustraccion real y no equivaler a una
  caja segmentada, clipping visual o `bounding_box_v1`.
- Dos intersecciones CSG complementarias deben conservar el volumen de la
  fuente con delta menor a `0.00001 m3`.
- El harness debe renderizar un canvas WebGL no vacio, sin overflow ni errores
  en desktop y mobile.
- El smoke positivo BIM debe exigir los artefactos dedicados de esta TASK.
- GiProy Clasico debe permanecer intacto con BIM apagado.

## Alcance y limites

- Motor: `three-bvh-csg`, Three.js y geometria manifold controlada.
- Esta TASK prueba CSG exacto para la malla evaluada, no compatibilidad universal
  con IFC defectuosos ni persistencia PostgreSQL del resultado.
- La materializacion versionada y el consumo por el viewer de producto quedan
  como siguiente slice una vez superado este gate geometrico.

## Rollback

Retirar el harness, su validador y la dependencia `three-bvh-csg`. No existen
migraciones, escrituras de datos ni cambios en rutas visibles.

## Validacion ejecutada

- `node scripts/validate-bim-csg-dom.mjs`: OK en `1280x820` y `390x844`.
- `node scripts/smoke-bim-workspace-positive.mjs`: OK.
- `npm run build`: OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend`: OK.

Resultado reproducible: volumen fuente y suma de particiones coinciden con
delta inferior a `0.00001 m3`; la fuente perforada y las particiones presentan
triangulacion CSG nueva y canvas WebGL no vacio.
