# BIM-TASK-0071 - Registro de datasets IFC reales

Estado: Cerrada localmente

## Objetivo

Crear un corpus IFC real, licenciado, reproducible y verificable que sustituya
la dependencia exclusiva de simulaciones sinteticas para parser y Fragments.

## Alcance autorizado

- Perimetro BIM aislado.
- Modelos publicos buildingSMART bajo CC BY 4.0.
- Contrato de manifiesto, validacion backend y smoke Fragments.
- Sin endpoints, DB real, auth, tenant ni modulos clasicos.

## Implementacion

- `backend/app/tests/fixtures/bim/real/manifest.json` registra cinco IFC:
  PCERT Architecture, Structural y HVAC en IFC4, y Duplex Architecture y MEP
  en IFC2x3.
- El corpus cubre arquitectura, estructura y MEP con tiers de regresion small,
  medium y large, mas una federacion reproducible de cinco miembros.
- Cada entrada conserva publisher, URL, licencia, atribucion, schema, MVD,
  disciplina, bytes, SHA-256, entidades, storeys, elementos y clases exigidas.
- `dataset_registry.py` valida contrato, licencia, procedencia, rutas contenidas,
  bytes, checksum, schema, parser y agregados de federacion.
- El parser textual incorpora ocurrencias MEP IFC2x3 genericas y las clases IFC4
  observadas `IFCAIRTERMINAL` e `IFCDUCTSEGMENT`.
- `smoke-bim-real-dataset-corpus.mjs` convierte fisicamente los cinco modelos
  con `IfcImporter` y WASM local de `web-ifc`.

## Evidencia del corpus

| Dataset | Schema | Bytes fuente | Elementos parser | Bytes Fragments |
|---|---:|---:|---:|---:|
| PCERT Architecture | IFC4 | 225635 | 13 | 18570 |
| PCERT Structural | IFC4 | 296640 | 15 | 19940 |
| PCERT HVAC | IFC4 | 179727 | 5 | 11664 |
| Duplex Architecture | IFC2X3 | 2380763 | 144 | 248523 |
| Duplex MEP | IFC2X3 | 17871432 | 926 | 1290534 |

La federacion suma 20954197 bytes fuente y 1103 elementos parseados.

## Validacion

- `pytest test_bim_foundation.py test_bim_ifc_simulations.py
  test_bim_real_dataset_registry.py`: 49 passed.
- `py_compile` de parser, registry y tests: OK.
- `node scripts/smoke-bim-workspace-positive.mjs`: OK.
- `node scripts/smoke-bim-real-dataset-corpus.mjs`: 5 datasets OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK; warning conocido de chunk grande Vite.
- Warnings conocidos no bloqueantes: Pydantic `model_name/model_id`, httpx y
  transaccion de fixtures existentes.

## No interferencia clasica

- No se modifican pantallas, APIs, servicios, modelos ni datos clasicos.
- BIM permanece protegido por sus flags existentes.
- No se toca TASK-1807 ni sus guardas.
- No se crea ni modifica infraestructura Docker/Coolify/CI/CD.

## Limites declarados

- Los tiers S/M/L son relativos al corpus de regresion.
- Los budgets de 50 MB a 1 GB y 100k a 2M elementos pertenecen a
  `BIM-TASK-0088` y no se declaran validados aqui.
- El corpus prueba conversion Fragments; el canvas de producto con estos
  modelos se cierra en Gate B.

## Rollback

Retirar los fixtures, `dataset_registry.py`, su test y el smoke de corpus;
revertir las clases MEP agregadas al parser y eliminar las referencias de
estado documental. No existe rollback de DB ni de GiProy Clasico.
