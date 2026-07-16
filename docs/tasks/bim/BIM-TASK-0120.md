# BIM-TASK-0120 - CSG sobre geometria IFC real

Estado: cerrada localmente.

## Objetivo

Cerrar la distancia entre la malla manifold controlada y un sólido proveniente
de un dataset IFC real con licencia y checksum conocidos.

## Criterios

- Usar buildingSMART PCERT Architecture desde el corpus BIM real.
- Verificar SHA-256 y conversión no vacía a Fragments.
- Extraer triangulación y transformación desde `web-ifc` preservando ExpressId
  y GlobalId.
- Partir una malla IFC manifold mediante CSG y conservar volumen dentro de
  tolerancia relativa `0.01%`.
- Mantener este gate aislado de GiProy Clásico y sin conexión Bentley.

## Límite explícito

La geometría CSG se extrae directamente con `web-ifc` de la misma fuente que se
convierte a Fragments. El round-trip desde `FragmentsModels.getItemsGeometry`
hacia CSG queda como siguiente gate de producto.

## Evidencia

- Dataset: `bsi-pcert-ifc4-architecture`, SHA-256 verificado.
- Conversion Fragments: `18,439` bytes.
- Solido: ExpressId `448`, GlobalId `1yP7NInQz5uQzbiOpVFFJr`.
- Volumen fuente: `143.555999 m3`.
- Volumen particiones: `143.556000 m3`.
- Delta: `0.000000926 m3`.
- `node scripts/smoke-bim-real-ifc-csg.mjs`: OK.
- `node scripts/smoke-bim-workspace-positive.mjs`: OK.
