# Plan de implementación - Portal de compras públicas - precio derivado por tramos

## Objetivo
Hacer que el precio comercial del artículo `Portal de compras públicas` deje de ser editable y pase a derivarse automáticamente del `Precio de licitación`.

## Alcance
- Solo `Panel Administrador de Tienda > Productos > Portal de compras públicas`
- Frontend del modal especializado
- Backend de creación/edición de marketplace
- Sin cambios BIM

## Regla comercial
- `0` a `100000.00` -> `11.50 USD`
- `100000.01` a `300000.00` -> `35.50 USD`
- `300000.01` a `1000000.00` -> `115.00 USD`
- `> 1000000.00` -> `345.00 USD`

## Implementación prevista
1. Sustituir el campo editable de precio por un campo de solo lectura.
2. Calcular el precio visible desde `precio_licitacion`.
3. Enviar al payload el precio derivado, no un valor editado por usuario.
4. Recalcular también en backend para blindar la política.
5. Mantener intactas:
   - publicación
   - activación
   - metadatos de licitación
   - flujo de preview y guardado

## Riesgos a evitar
- Divergencia entre precio mostrado y precio persistido.
- Que un payload manual salte la política.
- Afectar otros tipos de producto del marketplace.
- Introducir dependencia con BIM.

## TASK relacionada
- `TASK-0699.md`
