# APU Report Merge Row Alignment

## Objetivo
- Igualar mejor la presentación Excel de hojas APU con el ejemplo real embebido en `Presupuesto ejemplo - General.xlsx`.
- Corregir la degradación visual en filas repetidas de categorías (`Materiales`, `Transporte`, `Mano de Obra`) cuando el APU tiene más de un ítem.

## Problema Detectado
- El generador insertaba filas nuevas y copiaba contenido/estilos, pero no clonaba los `merged ranges` horizontales de la fila patrón.
- Eso rompía la maqueta original de la plantilla:
  - una fila podía verse correcta
  - la siguiente quedaba “angosta”, con descripción partida o distinta a la del ejemplo
- El problema afectaba tanto a:
  - `Presupuesto + APUs`
  - `APU` standalone

## Ajuste Implementado
1. Añadir clonación de merges de fila simple al copiar una fila patrón.
2. Aplicar esa clonación en el motor común de expansión de categorías APU.
3. Endurecer el smoke test para comprobar los merges críticos del bloque `Mano de Obra`.

## Alcance
- `001 - Analisis - APUS - General.xlsx`
- Cualquier reporte Excel que reutilice el motor APU general:
  - `APU`
  - `Presupuesto + APUs`

## Validación
- `py_compile` del servicio y del smoke test.
- `smoke_test_reporting_apu_excel_alignment.py` sobre `Santiago Bermeo`.
