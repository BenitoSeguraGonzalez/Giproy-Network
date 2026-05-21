# ExecPlan - Buscador de subcategorías en Precios Unitarios > Recursos

## Objetivo
Llevar a `Precios Unitarios > Recursos` el mismo patrón de búsqueda lateral de subcategorías que ya existe en `Precios Unitarios > Análisis de Precios Unitarios (APU)`.

## Alcance
- Campo de búsqueda de subcategorías en el sidebar de `Recursos`
- Filtro por `descripción` y `código`
- Estado vacío de `Sin coincidencias`
- Mantener la estética actual del módulo

## Criterio de cierre
- El sidebar de subcategorías en `Recursos` permite filtrar por texto
- El comportamiento visual y funcional queda alineado con `APUs`
- No se rompe la navegación, el drag & drop ni la selección actual de subcategoría

## Tasks
- `TASK-0770`: Adecuación UX del sidebar de subcategorías en `Recursos`
- `TASK-0771`: Implementación del filtro y estados vacíos alineados con `APUs`
