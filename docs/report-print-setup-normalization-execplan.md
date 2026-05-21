# Report Print Setup Normalization Execplan

## Objetivo
Eliminar cualquier rastro de `INTERPRO` en encabezados/pies de impresión y normalizar la salida Excel para que todos los reportes impriman a una sola página de ancho sin perder columnas derechas.

## Alcance
- Presupuesto
- Presupuesto + APUs
- APU
- EDT
- VAE
- Fórmula Polinómica
- Cualquier workbook generado por `backend/app/services/reporting.py`

## Estrategia
1. Limpiar encabezados y pies de hoja en tiempo de generación para no depender de la plantilla.
2. Forzar `print_area` al rango realmente usado por cada hoja.
3. Forzar `fitToWidth = 1`, `fitToHeight = 0` y `fitToPage = true`.
4. Dejar smoke test dedicado para verificar:
   - ausencia de `INTERPRO`
   - `print_area` cubriendo todas las columnas usadas
   - una sola página de ancho

## Criterios de aceptación
- Ningún Excel generado contiene `INTERPRO` en headers/footers.
- Todas las hojas relevantes imprimen a una página de ancho.
- Ninguna columna usada queda fuera del `print_area`.
- El smoke test `backend/scripts/smoke_test_reporting_print_setup.py` pasa sobre `Santiago Bermeo`.
