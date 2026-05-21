# Plan de adecuación · APUs listado · filtros de validación y visibilidad

## Objetivo
Añadir al listado de `APUs` tres mejoras operativas sin romper el look & feel actual:

- filtro por estado válido del módulo (`Todos`, `Pendientes`, `Revisados`)
- deselección de subcategoría al pulsar de nuevo la categoría activa
- contador transversal de `APUs visibles / APUs totales`

## Criterios
- No alterar la lógica actual de carga, selección múltiple, reportes o edición.
- Mantener la barra superior y el sidebar con la gramática visual actual.
- Evitar una recarga visual innecesaria del módulo.
- Respetar la semántica ya saneada de estados: `Pendiente` y `Revisado`.

## Slice funcional
1. Añadir un filtro visual compacto de estado en la barra superior.
2. Permitir que una subcategoría APU se desactive al hacer segundo click.
3. Mostrar el contador `visibles / totales` en el encabezado del listado.

## Riesgos a vigilar
- Que la deselección de subcategoría no vuelva a autoseleccionar la primera al refrescar.
- Que `Seleccionar visibles` siga operando solo sobre el subconjunto efectivamente visible.
- Que la búsqueda global y el filtro de estado compongan correctamente.

## Validación
- `Todos / Pendientes / Revisados` debe cambiar el listado sin romper búsqueda ni selección.
- Al pulsar de nuevo la subcategoría activa, el listado debe pasar a mostrar todos los APUs de la base.
- El contador debe reflejar correctamente `visibles / totales`.
