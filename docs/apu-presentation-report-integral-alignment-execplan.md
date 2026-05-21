# ExecPlan: Integral APU Presentation Alignment For Budget Reports

## Objetivo
- Alinear la presentación de hojas `APU` en:
  - `Presupuesto + APUs`
  - reporte standalone de `APU`
  - cualquier carril Excel que reutilice las plantillas APU
- Igualar la estructura real de salida contra los ejemplos:
  - `docs/adicionales/Presupuesto ejemplo - General.xlsx`
  - `docs/adicionales/Presupuesto ejemplo - SERCOP.xlsx`

## Hallazgos
1. El motor categorizado de APU seguía usando las plantillas standalone activas de `docs/reportes`.
2. Esas plantillas no coincidían ya con la estructura embebida en las hojas APU de los ejemplos de presupuesto.
3. La desviación no era solo visual:
   - encabezados de bloque incorrectos
   - filas placeholder en posiciones erróneas
   - transporte SERCOP sin fila cabecera correcta
   - texto total del APU sin el estilo esperado del ejemplo general

## Ajustes realizados
1. Se reconstruyeron las plantillas activas:
   - `001 - Analisis - APUS - General.xlsx`
   - `002 - Analisis - APUS - SERCOP.xlsx`
   a partir de las hojas APU reales de los ejemplos (`501139`), conservando merges, tipografías, alturas y anchos.
2. Se dejó un script reproducible:
   - `backend/scripts/rebuild_apu_templates_from_examples.py`
3. Se añadió `#TEXTOTOTAL` al contrato de datos del APU y se alineó su texto al estilo del ejemplo general (`UNO CON 04/100 DÓLARES...`).
4. El reporte de presupuesto volvió a usar `#TEXTOTOTAL` como cuerpo del texto, evitando duplicar `Son:`.
5. Se endureció el motor categorizado para preservar cabeceras, placeholders y footer aunque `openpyxl` degrade merges al borrar o insertar filas.
6. Se creó un smoke test integral:
   - `backend/scripts/smoke_test_reporting_apu_excel_alignment.py`

## Alcance
- `backend/app/services/reporting.py`
- `backend/scripts/rebuild_apu_templates_from_examples.py`
- `backend/scripts/smoke_test_reporting_apu_excel_alignment.py`
- `docs/reportes/001 - Analisis - APUS - General.xlsx`
- `docs/reportes/002 - Analisis - APUS - SERCOP.xlsx`

## Validación
- `python -m py_compile` sobre servicio y scripts: OK
- smoke test real con `Santiago Bermeo`: PASS
- validado en:
  - `Presupuesto + APUs` `001`
  - `Presupuesto + APUs` `002`
  - `APU` standalone `001`
  - caso complejo `5-001-0001` con múltiples líneas por categoría
