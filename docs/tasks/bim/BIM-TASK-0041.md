# BIM-TASK-0041 - Smoke local de fragments binarios

## Estado

Cerrada localmente el 2026-07-09.

## Objetivo

Abrir la puerta real de fragments binarios usando el stack autorizado
`@thatopen/fragments`, sin depender de servidor ni activar UX BIM visible fuera
del perimetro BIM.

## Alcance

- Crear smoke local reproducible que use `IfcImporter` de
  `@thatopen/fragments`.
- Usar WASM local de `web-ifc` instalado en `frontend/node_modules`.
- Procesar una muestra IFC controlada hacia bytes fragments no vacios.
- Endurecer el smoke BIM positivo para exigir que el carril IFC/3D conserve una
  prueba binaria real, no solo dependencias instaladas.

## Cambios realizados

- Se agrega `frontend/scripts/smoke-bim-fragments-importer.mjs`.
- El script configura `IfcImporter.wasm` contra `frontend/node_modules/web-ifc`.
- El script ejecuta `importer.process(...)` y valida `Uint8Array` con
  `byteLength > 0`.
- `frontend/scripts/smoke-bim-workspace-positive.mjs` exige la existencia y uso
  real del importer fragments.

## No alcance

- No se conecta todavia `FragmentsModels` al viewer BIM visible.
- No se persisten fragments en backend ni se agregan endpoints nuevos.
- No se incorporan datasets IFC reales/representativos.
- No se despliega a servidor.

## Validacion

- `cmd /c node scripts\smoke-bim-fragments-importer.mjs` desde `frontend`: OK,
  fragments binario generado con bytes no vacios.
- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend\scripts\smoke-classic-no-bim-contamination.mjs`: OK.

## Rollback

Revertir:

- `frontend/scripts/smoke-bim-fragments-importer.mjs`
- cambios en `frontend/scripts/smoke-bim-workspace-positive.mjs`

El rollback no requiere cambios de base de datos, migraciones ni artefactos de
deploy.

## Pendiente posterior

- `BIM-TASK-0042`: cargar fragments binarios con `FragmentsModels` en harness
  aislado.
- dataset IFC representativo y simulaciones de volumen.
- renderer fragments maduro o puente visual avanzado.
