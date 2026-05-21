# Ajuste del Excel de salida del Portal a `APU_Presupuesto_Completo.xlsx`

## Resumen
El Excel de salida del `Portal de compras públicas` debe abandonar la plantilla previa `Formato de salida-entrega.xlsx` y pasar a generarse desde `docs/adicionales/APU_Presupuesto_Completo.xlsx`, respetando la estructura formulada del archivo de referencia.

## Objetivo
- Generar un Excel completo, no una versión resumida.
- Crear una hoja `APU_*` por cada APU/rubro exportable del bundle.
- Conservar la lógica formulada de la plantilla en `PRESUPUESTO`, `DESAGREGACIÓN CONSOLIDADA`, `INDICE_APUs` y en cada `APU_*`.
- Evitar límites artificiales de muestras (`sample_*`, topes por número de APUs o recursos).

## Ajustes necesarios

### 1. Frontend
- Dejar de recortar `import_analysis.analysis_bundle` a `sample_*` al preparar la exportación Excel.
- Enviar al backend el bundle completo:
  - `apus`
  - `resources`
  - `apu_links`
  - `vae_entries`
  - `sample_*` como apoyo de UX, pero no como fuente única del Excel.

### 2. Backend
- Cambiar la plantilla base a `docs/adicionales/APU_Presupuesto_Completo.xlsx`.
- Construir el Excel desde colecciones completas, no desde muestras.
- Generar una hoja `APU_*` por cada entrada exportable del presupuesto/APU reconciliado.
- Poblar los catálogos `CAT_*` con todos los recursos deduplicados.
- Mantener fórmulas vivas:
  - `PRESUPUESTO` debe depender de `INDICE_APUs`.
  - `DESAGREGACIÓN CONSOLIDADA` debe depender de `INDICE_APUs` y de cada `APU_*`.
  - `INDICE_APUs` debe depender de cada hoja `APU_*`.
  - Cada `APU_*` debe depender de `CAT_*`, `PARAMETROS` y `UMBRAL_SERCOP`.

### 3. Cobertura funcional
- Si existen 200 APUs exportables, el archivo debe contener 200 hojas `APU_*`.
- Si un APU no tiene recursos suficientes, debe mantener fórmulas válidas y fallback operativo sobre precio unitario técnico/presupuestario.
- El archivo debe seguir siendo usable incluso en casos parciales:
  - presupuesto only
  - presupuesto + APUs
  - bundle completo

## Criterios de validación
- El archivo generado abre sin corrupción.
- `PRESUPUESTO` queda formulado contra `INDICE_APUs`.
- `DESAGREGACIÓN CONSOLIDADA` queda formulada contra `INDICE_APUs` y `APU_*`.
- `INDICE_APUs` refleja el mismo número de APUs que hojas `APU_*`.
- El número de hojas `APU_*` coincide con los APUs exportables del bundle.
- No hay truncado por límites fijos de 20 o 25 elementos.
- La descarga desde el editor sigue funcionando.

## Riesgos controlados
- La plantilla nueva tiene filas y fórmulas con geometría fija; el generador debe respetar esa gramática sin degradarla a valores estáticos.
- La exportación debe seguir soportando backends ya levantados y no romper el flujo administrativo existente.
