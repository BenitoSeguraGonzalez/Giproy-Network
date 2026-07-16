# BIM-TASK-0121 - Round-trip FragmentsModels hacia CSG

Estado: cerrada localmente.

## Objetivo

Obtener geometría desde `FragmentsModels.getItemsGeometry`, reconstruir una
malla Three.js por `localId`, resolver su GlobalId, ejecutar CSG conservativo y
producir un artefacto persistible por el contrato BIM versionado.

## Criterios

- Bytes Fragments generados desde IFC real buildingSMART.
- `localId` y GlobalId consultados desde `FragmentsModels`.
- CSG alimentado por `MeshData.positions/indices/normals/transform`.
- Canvas WebGL no vacío y responsive.
- Payload POST/GET verificado por checksum y cliente BIM de dominio.
- Sin montaje visible fuera del harness ni interferencia clásica.

## Cambios realizados

- Se agrego un harness aislado que carga bytes Fragments generados desde el IFC
  real buildingSMART PCERT Architecture mediante `FragmentsModels`.
- La triangulacion se reconstruye desde
  `getItemsGeometry([localId])`, incluyendo posiciones, normales, indices y
  transform, y el GlobalId se resuelve con `getGuidsByLocalIds`.
- La malla real alimenta dos intersecciones CSG complementarias y produce el
  payload `giproy_bim_4d_csg_artifact_v1` aceptado por el cliente BIM.
- El ciclo de vida libera workers, renderer, controles, geometrías y materiales
  creados por el harness.

## Evidencia

- Fragments: `18,437` bytes generados desde el IFC real.
- Elemento: localId `464`, GlobalId `3_4VN63S96DfWiJjgG8j1C`.
- Volumen fuente y particionado: `6.345857 m3`; delta: `0` a seis decimales.
- `validate-bim-fragments-csg-dom.mjs`: desktop/mobile, canvas WebGL no vacio,
  POST/GET por checksum y ausencia de overflow/errores.
- Suite BIM: `120 passed`; validador PostgreSQL reversible hasta
  `de2022a1b2c3`; build, smoke BIM, anti-BIM y baseline enterprise en verde.

## Limite conservado

El artefacto exacto ya es producible desde geometria Fragments real y
persistible, pero el panel BIM de producto aun renderiza el artefacto
parametrico `bounding_box_v1`. El siguiente slice debe consumir el artefacto
CSG persistido dentro del perimetro BIM controlado.
