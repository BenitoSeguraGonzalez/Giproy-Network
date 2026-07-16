# BIM-TASK-0044 - Quantities, materiales y sistemas IFC

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Enriquecer el parser IFC textual BIM para extraer quantities, materiales y
sistemas desde entidades STEP/IFC habituales, sin ampliar contratos ni crear
migraciones nuevas.

## Alcance

- Parsear `IFCELEMENTQUANTITY` enlazado por `IFCRELDEFINESBYPROPERTIES`.
- Parsear quantities `IFCQUANTITY*` simples y persistirlas como propiedades
  BIM con prefijo estable `Quantity.`.
- Parsear `IFCRELASSOCIATESMATERIAL` con material directo `IFCMATERIAL`.
- Parsear `IFCRELASSIGNSTOGROUP` hacia `IFCSYSTEM`.
- Agregar simulacion IFC sintetica S5 para validar quantities, materiales y
  sistemas.

## Cambios realizados

- `backend/app/services/bim/ifc_parser.py` agrega mapas de quantities,
  materiales y sistemas por elemento.
- Las quantities quedan en `properties` como
  `Quantity.<set>.<quantity_name>`.
- Los materiales quedan en `metadata_json.ifc_materials`.
- El sistema queda en `system_name` y `metadata_json.ifc_system_name`.
- Se normalizan valores numericos y booleanos IFC planos en el helper de
  valores tipados.
- `backend/app/tests/test_bim_ifc_simulations.py` agrega S5 como prueba focal.

## No alcance

- No se crean tablas ni migraciones.
- No se implementan materiales compuestos completos ni capas avanzadas.
- No se introduce dataset geometrico real.
- No se activa UX BIM visible en modulos clasicos.

## Validacion

- `python -m py_compile backend\app\services\bim\ifc_parser.py backend\app\tests\test_bim_ifc_simulations.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py` desde `backend`: OK, 5 passed, warnings Pydantic conocidos.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.

Nota: el comando pytest documentado se ejecuto como
`..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_ifc_simulations.py`.

## Rollback

Revertir:

- cambios en `backend/app/services/bim/ifc_parser.py`
- cambios en `backend/app/tests/test_bim_ifc_simulations.py`
- esta TASK y sus referencias documentales

El rollback no requiere migraciones ni cambios de base de datos.

## Pendiente posterior

- `BIM-TASK-0043`: dataset IFC geometrico representativo.
- `BIM-TASK-0045`: renderer fragments maduro o puente visual avanzado.
- Simulaciones de volumen con datasets representativos cuando exista fixture
  IFC real autorizado.
