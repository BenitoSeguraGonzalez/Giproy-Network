# ExecPlan: APU Report Example Alignment

## Objetivo
- Alinear el informe Excel de `APUs` con el reporte ejemplo general y su variante `SERCOP`.
- Replicar la forma de actuación del ejemplo en:
  - estructura por bloques
  - títulos de hoja
  - limpieza de filas de muestra
  - comportamiento de fórmulas al duplicar filas

## Alcance
- `backend/app/services/reporting.py`
- `docs/reportes/001 - Analisis - APUS - General.xlsx`
- `docs/reportes/002 - Analisis - APUS - SERCOP.xlsx`

## Ajustes realizados
1. Se revisó el contrato real de las plantillas activas frente a los ejemplos de referencia.
2. Se detectó que las plantillas activas conservaban filas de ejemplo entre la fila placeholder y los subtotales de bloque.
3. El motor categorizado de APUs ahora elimina esas filas intermedias antes de expandir cada categoría.
4. La copia de filas preserva fórmulas con traducción de referencias por fila, evitando que `Costo hora` repita la referencia de la fila anterior.
5. La hoja generada para reportes individuales de APU ahora toma como nombre el código del APU, igual que en el ejemplo.

## Validación
- Generación real de `APU 5-001-0001` en empresa `Santiago Bermeo`.
- Verificación de:
  - título de hoja `5-001-0001`
  - bloques `Equipos`, `Materiales`, `Transporte`, `Mano de Obra`
  - ausencia de filas de muestra residuales
  - fórmulas desplazadas correctamente en variante `SERCOP`
