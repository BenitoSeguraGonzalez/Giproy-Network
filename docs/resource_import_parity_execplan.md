# ExecPlan: Paridad Importador de Recursos vs Importador de APUs

## Objetivo funcional

Elevar el importador de `Precios Unitarios > Recursos` al mismo nivel operativo del importador de `APUs`, manteniendo las reglas propias de recursos:

- reconocimiento inteligente de filas desde portapapeles
- preview previo a importación
- validación temprana
- clasificación de filas válidas / omitidas / duplicadas
- feedback claro de importación
- sin romper el flujo actual de recursos

## Estado actual

El importador de recursos ya tiene:

- parser tabular y fallback texto plano
- preview básico en memoria
- detección básica de duplicados por descripción
- resolución básica de unidad
- importación backend por lote

Carencias respecto al importador de APUs:

- modal simplificado, sin tablero de control ni tabla de revisión
- validaciones menos expresivas
- menor robustez en reconocimiento y normalización
- feedback de error poco preciso
- menor paridad visual y funcional

## Diseño propuesto

La adecuación será por extensión:

- reutilizar `ImportFormatHint`
- conservar endpoint actual `/recursos/import`
- enriquecer parser/preview frontend antes de enviar
- endurecer validaciones backend sin cambiar contrato base
- mantener categorías/subcategorías actuales y reglas de negocio de recursos

## Fases

### Fase 1. Discovery y documentación

- comparar parser, preview y confirmación entre APUs y recursos
- documentar gaps y tasks

### Fase 2. Parser y preview de recursos

- ampliar reconocimiento de columnas
- normalizar unidad y campos opcionales
- clasificar motivos de exclusión
- producir métricas del lote

### Fase 3. UX modal de recursos

- llevar modal de recursos al patrón del de APUs
- añadir bloque de ayuda, textarea, resumen y tabla de filas procesadas
- bloquear confirmación sin filas válidas o sin subcategoría destino

### Fase 4. Backend y robustez

- reforzar importación por lote
- mejorar mensajes de error
- asegurar compatibilidad con base/proyecto y subcategoría destino

### Fase 5. Validación

- `py_compile`
- `npm run build`
- revisión manual del flujo

## Riesgos

- divergencia funcional entre recursos y APUs
- falsos positivos en reconocimiento de columnas
- diferencias de reglas entre categorías de recursos

## Mitigación

- mantener parser especializado para recursos
- no copiar lógica de APU literalmente cuando no aplica
- conservar validaciones backend como fuente final de verdad

## Validaciones

- importación con tabla tabulada
- importación con texto plano
- unidades conocidas/desconocidas
- duplicados internos y existentes
- importación sin subcategoría seleccionada
- errores backend visibles para el usuario
