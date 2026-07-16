# BIM-TASK-0038 - Parsing IFC profundo inicial

## Estado

Cerrada localmente.

## Objetivo

Profundizar el parser IFC inicial para que el motor BIM no solo cuente
entidades, sino que empiece a resolver relaciones espaciales y propiedades
semanticas basicas desde estructuras IFC estandar.

## Alcance

- Resolver `IFCRELCONTAINEDINSPATIALSTRUCTURE` para asignar elementos a
  `IFCBUILDINGSTOREY`.
- Resolver `IFCRELDEFINESBYPROPERTIES` para vincular elementos con property
  sets.
- Leer `IFCPROPERTYSET` y `IFCPROPERTYSINGLEVALUE`.
- Normalizar valores tipados simples: texto, numericos y booleanos.
- Persistir propiedades en `BimElement.properties`.
- Registrar conteo de propiedades en `BimElement.metadata_json`.
- Agregar simulacion S4 para relaciones espaciales y property sets.

## Cambios realizados

- `backend/app/services/bim/ifc_parser.py` agrega mapas internos de records,
  storeys, relaciones espaciales y property sets.
- Los elementos importados desde IFC textual ahora pueden recibir `storey_name`
  desde relaciones espaciales.
- Los elementos importados ahora pueden recibir propiedades semanticas desde
  property sets IFC.
- `backend/app/tests/test_bim_ifc_simulations.py` agrega S4:
  `IFCRELCONTAINEDINSPATIALSTRUCTURE` + `IFCRELDEFINESBYPROPERTIES` +
  `IFCPROPERTYSET` + `IFCPROPERTYSINGLEVALUE`.

## No interferencia

- No se agregan tablas ni migraciones nuevas.
- No se altera el contrato clasico ni modulos EDT/APUs/Presupuesto/Cronogramas.
- No se activa UX BIM visible.
- No se toca servidor, Docker, Coolify, staging ni produccion.

## Validacion

- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py -q`:
  OK, 4 passed.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py app\tests\test_bim_ifc_simulations.py -q`:
  OK, 42 passed.
- `python -m py_compile app\services\bim\ifc_storage.py app\services\bim\ifc_parser.py app\services\bim\import_service.py app\api\endpoints\bim_models.py app\schemas\bim_model.py app\core\config.py`:
  OK.

## Limitaciones explicitas

- No cubre aun property sets complejos, listas, tablas ni propiedades anidadas.
- No resuelve materiales, tipos, sistemas MEP ni cantidades completas.
- No genera geometria real ni fragments.
- No reemplaza todavia un parser IFC industrial; es una puerta semantica
  incremental para el motor BIM local.

## Pendiente posterior

- `BIM-TASK-0039`: fragments/artefactos optimizados y viewer 3D maduro.
- `BIM-TASK-0040`: simulaciones con datasets IFC reales/representativos y
  metricas de rendimiento/carga.
- `BIM-TASK-0041`: quantities/materiales/tipos/sistemas MEP.

## Rollback

Revertir los cambios de `ifc_parser.py` y la simulacion S4. El parser vuelve al
estado de conteo + storeys/elementos sin relaciones espaciales ni property
sets.
