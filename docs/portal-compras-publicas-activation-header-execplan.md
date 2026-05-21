# Plan de adecuación - Portal de compras públicas - activación en header

## Objetivo
Mover la activación del producto desde la tarjeta interna `Producto activo` hacia un control tipo slider en el header del modal especializado de `Portal de compras públicas`, junto a `Código` y `Creador`.

## Alcance
- Solo `Panel Administrador de Tienda > Productos > Portal de compras públicas`
- Solo capa clásica
- Sin cambios en BIM
- Sin cambios en el contrato backend de `activo`

## Criterios de diseño
- El estado de activación debe leerse como metadata operativa de cabecera.
- La meta común del producto debe quedar más limpia y compacta.
- El cambio debe respetar el patrón modal existente del panel administrador.

## Implementación prevista
1. Añadir un control tipo slider en las acciones del `AppModalHeader`.
2. Mostrar allí:
   - etiqueta del bloque
   - estado `Activo / Inactivo`
   - helper corto de publicación
3. Retirar la tarjeta checkbox del cuerpo del formulario.
4. Mantener `portalForm.activo` como única fuente de verdad del estado visual y del payload.

## Riesgos a evitar
- Romper creación/edición del producto por pérdida del campo `activo`.
- Duplicar fuentes de verdad entre body y header.
- Desalinear el modal con el patrón visual ya compactado en `TASK-0684`.
- Introducir cualquier dependencia con BIM.

## TASK relacionada
- `TASK-0698.md`
