# BIM-TASK-0122 - Consumo CSG persistido en panel BIM

Estado: cerrada localmente.

## Objetivo

Hacer que el panel de particiones del workspace BIM consulte y renderice la
revision CSG persistida mas reciente, conservando `bounding_box_v1` como
fallback y sin alterar GiProy Clasico.

## Criterios

- Lectura mediante `bimModelsApi`, sin acceso HTTP directo desde componentes.
- Reconstruccion Three.js desde posiciones, normales e indices persistidos.
- Priorizacion explicita de CSG exacto sobre el artefacto parametrico.
- Canvas WebGL no vacio, responsive y con cleanup completo.
- Revision, metodo, checksum y volumen visibles y trazables.
- Smoke BIM focal, build, anti-BIM y baseline enterprise en verde.

## Cambios realizados

- `BimConstructiblePartitionPanel` consulta por `bimModelsApi` la revision CSG
  mas reciente de la especificacion seleccionada.
- El preview reconstruye `BufferGeometry` desde posiciones, normales e indices
  persistidos, ajusta la malla al viewport y libera geometria/materiales al
  desmontar.
- Cuando existe CSG se prioriza `exact_bvh_csg_v1`; `bounding_box_v1` permanece
  disponible como fallback y rollback compatible.
- El panel muestra revision, metodo, checksum y volumen persistido sin modificar
  ni sobrescribir el IFC fuente.

## Validacion

- `validate-bim-partition-dom.mjs`: fallback preview/parametrico verde.
- `validate-bim-partition-csg-product-dom.mjs`: CSG exacto, canvas no vacio,
  desktop/mobile, sin overflow ni errores.
- `smoke-bim-workspace-positive.mjs`, `npm run build`, smoke anti-BIM y baseline
  enterprise completos en verde.

## Limite conservado

Este cierre completa la cadena tecnica local CSG hasta la UX BIM de producto.
No cierra Gate D, que requiere autorizacion de integracion clasica, ni Gate E,
que requiere piloto real temporal con usuarios y dos revisiones.
